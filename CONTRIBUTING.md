# Contributing to Happy Teens Movie Platform

Thank you for considering contributing to the Happy Teens Movie Platform! This document outlines the guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Describe the expected behavior and what actually happened
- Include information about your environment (browser, OS, etc.)

### Suggesting Features

- Check if the feature has already been suggested in the Issues section
- Use the feature request template when creating a new issue
- Provide a clear description of the feature
- Explain why this feature would be useful to most users
- Consider how the feature would work with existing functionality

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for user data and metadata storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/danny-dis/happy-teens-movie-project.git
cd happy-teens-movie-project
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
API_KEY=your_movie_api_key
PORT=5000
```

4. Start the development servers:
```bash
# Start the backend server
npm start

# In a separate terminal, start the client
cd client
npm start
```

## Coding Guidelines

### JavaScript/React

- Follow the Airbnb JavaScript Style Guide
- Use functional components with hooks
- Use descriptive variable and function names
- Add comments for complex logic
- Keep components small and focused on a single responsibility
- Use PropTypes for component props

### CSS

- Use CSS modules or styled-components
- Follow BEM naming convention for class names
- Keep selectors simple and avoid deep nesting
- Use variables for colors, fonts, and other repeated values

### Testing

- Write tests for new features
- Ensure all tests pass before submitting a pull request
- Aim for good test coverage

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation if you're changing functionality
3. The PR should work in all supported browsers
4. Your PR needs to be approved by at least one maintainer
5. Make sure your code passes all tests

## Additional Notes

### P2P Implementation

When working on P2P functionality:
- Consider privacy implications
- Ensure secure communication between peers
- Test with various network conditions
- Document any configuration options

### Performance Considerations

- Optimize bundle size
- Minimize re-renders in React components
- Use lazy loading for images and components
- Consider mobile performance

Thank you for contributing to the Happy Teens Movie Platform!
