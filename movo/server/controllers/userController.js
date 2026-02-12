const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  DatabaseError,
  logger 
} = require('../middleware/errorHandler');

// Database connection - uses app.locals.db from server.js
const getDb = () => {
  if (typeof db !== 'undefined') {
    return db;
  }
  // Fallback for direct imports (not recommended)
  throw new DatabaseError('Database connection not available');
};

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Generate JWT token
const generateAccessToken = (userId, username) => {
  return jwt.sign(
    { userId, username, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomUUID() },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
};

// Register new user
exports.registerUser = async (req, res, next) => {
  const db = req.app.locals.db;
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, results) => {
        if (err) {
          logger.error('Database error during registration:', err);
          return next(new DatabaseError('Failed to check user existence'));
        }

        if (results.length > 0) {
          return next(new ConflictError('User with this email or username already exists'));
        }

        try {
          // Hash password
          const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

          // Create user object
          const user = {
            username,
            email,
            password: hashedPassword,
            created_at: new Date()
          };

          // Insert user into database
          db.query('INSERT INTO users SET ?', user, (err, result) => {
            if (err) {
              logger.error('Database error during user creation:', err);
              return next(new DatabaseError('Failed to create user'));
            }

            const userId = result.insertId;
            
            // Generate tokens
            const accessToken = generateAccessToken(userId, username);
            const refreshToken = generateRefreshToken(userId);

            // Store refresh token hash in database (optional but recommended for revocation)
            const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            db.query(
              'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
              [userId, refreshTokenHash],
              (err) => {
                if (err) {
                  logger.error('Failed to store refresh token:', err);
                  // Non-critical error, user is still created
                }
              }
            );

            logger.info(`User registered successfully: ${username} (${email})`);

            res.status(201).json({
              success: true,
              message: 'User registered successfully',
              data: {
                user: {
                  id: userId,
                  username,
                  email
                },
                accessToken,
                refreshToken,
                expiresIn: JWT_EXPIRES_IN
              }
            });
          });
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

// Login user
exports.loginUser = async (req, res, next) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  try {
    // Find user by username or email
    db.query(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, results) => {
        if (err) {
          logger.error('Database error during login:', err);
          return next(new DatabaseError('Failed to retrieve user'));
        }

        if (results.length === 0) {
          // Generic error message to prevent user enumeration
          return next(new AuthenticationError('Invalid credentials'));
        }

        const user = results[0];

        try {
          // Compare password
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            // Log failed attempt (optional: implement rate limiting here)
            logger.warn(`Failed login attempt for user: ${username}`);
            return next(new AuthenticationError('Invalid credentials'));
          }

          // Generate tokens
          const accessToken = generateAccessToken(user.id, user.username);
          const refreshToken = generateRefreshToken(user.id);

          // Store refresh token
          const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          db.query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
            [user.id, refreshTokenHash]
          );

          // Update last login
          db.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
          );

          logger.info(`User logged in successfully: ${user.username}`);

          res.json({
            success: true,
            message: 'Login successful',
            data: {
              user: {
                id: user.id,
                username: user.username,
                email: user.email
              },
              accessToken,
              refreshToken,
              expiresIn: JWT_EXPIRES_IN
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

// Refresh access token
exports.refreshToken = async (req, res, next) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ValidationError('Refresh token is required'));
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if token exists in database (optional: check if revoked)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    db.query(
      'SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked = FALSE AND expires_at > NOW()',
      [decoded.userId, refreshTokenHash],
      (err, results) => {
        if (err) {
          logger.error('Database error during token refresh:', err);
          return next(new DatabaseError('Failed to validate refresh token'));
        }

        if (results.length === 0) {
          return next(new AuthenticationError('Invalid or revoked refresh token'));
        }

        // Get user info
        db.query(
          'SELECT id, username, email FROM users WHERE id = ?',
          [decoded.userId],
          (err, userResults) => {
            if (err || userResults.length === 0) {
              return next(new AuthenticationError('User not found'));
            }

            const user = userResults[0];
            
            // Generate new tokens
            const newAccessToken = generateAccessToken(user.id, user.username);
            const newRefreshToken = generateRefreshToken(user.id);

            // Revoke old refresh token and store new one
            const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
            
            db.query(
              'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?',
              [refreshTokenHash],
              (err) => {
                if (err) {
                  logger.error('Failed to revoke old refresh token:', err);
                }
                
                db.query(
                  'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
                  [user.id, newRefreshTokenHash]
                );
              }
            );

            res.json({
              success: true,
              data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: JWT_EXPIRES_IN
              }
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};

// Logout user (revoke refresh token)
exports.logoutUser = async (req, res, next) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  try {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    db.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ?',
      [refreshTokenHash],
      (err) => {
        if (err) {
          logger.error('Failed to revoke refresh token during logout:', err);
        }
        
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      }
    );
  } catch (error) {
    next(error);
  }
};

// Middleware to authenticate requests
exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Access token is required'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return next(new AuthenticationError('Invalid token type'));
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token has expired'));
    }
    return next(new AuthenticationError('Invalid token'));
  }
};

// Get current user info
exports.getCurrentUser = (req, res, next) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  db.query(
    'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        logger.error('Database error fetching user:', err);
        return next(new DatabaseError('Failed to retrieve user'));
      }

      if (results.length === 0) {
        return next(new AuthenticationError('User not found'));
      }

      res.json({
        success: true,
        data: {
          user: results[0]
        }
      });
    }
  );
};

// Change password
exports.changePassword = async (req, res, next) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    // Get current password hash
    db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId],
      async (err, results) => {
        if (err || results.length === 0) {
          return next(new DatabaseError('Failed to retrieve user'));
        }

        const isValidPassword = await bcrypt.compare(currentPassword, results[0].password);

        if (!isValidPassword) {
          return next(new AuthenticationError('Current password is incorrect'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

        // Update password
        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, userId],
          (err) => {
            if (err) {
              logger.error('Failed to update password:', err);
              return next(new DatabaseError('Failed to update password'));
            }

            // Revoke all refresh tokens for security
            db.query(
              'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
              [userId]
            );

            logger.info(`Password changed for user ID: ${userId}`);

            res.json({
              success: true,
              message: 'Password updated successfully'
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
};
