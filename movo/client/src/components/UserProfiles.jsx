import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const UserProfiles = ({ onSelectProfile }) => {
  const [profiles, setProfiles] = useState([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState('adult');
  const [editingProfile, setEditingProfile] = useState(null);
  const [error, setError] = useState('');

  // Avatar options
  const avatarOptions = [
    '👨‍💼', '👩‍💼', '👦', '👧', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', 
    '👨‍🦲', '👩‍🦲', '👱‍♂️', '👱‍♀️', '🧔', '🧓', '👴', '👵'
  ];

  useEffect(() => {
    // Load profiles from localStorage
    const loadProfiles = () => {
      try {
        const savedProfiles = localStorage.getItem('userProfiles');
        if (savedProfiles) {
          setProfiles(JSON.parse(savedProfiles));
        } else {
          // Create default profile if none exist
          const defaultProfile = {
            id: 1,
            name: 'Main Profile',
            type: 'adult',
            avatar: '👨‍💼',
            createdAt: new Date().toISOString(),
            isDefault: true,
            parentalControls: {
              maxRating: 'PG-13',
              restrictedGenres: []
            }
          };
          setProfiles([defaultProfile]);
          localStorage.setItem('userProfiles', JSON.stringify([defaultProfile]));
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
        setError('Failed to load profiles');
      }
    };

    loadProfiles();
  }, []);

  // Save profiles to localStorage
  const saveProfiles = (updatedProfiles) => {
    try {
      localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error saving profiles:', error);
      setError('Failed to save profile changes');
    }
  };

  // Add new profile
  const handleAddProfile = () => {
    if (!newProfileName.trim()) {
      setError('Profile name cannot be empty');
      return;
    }

    if (profiles.length >= 5) {
      setError('Maximum of 5 profiles allowed');
      return;
    }

    if (profiles.some(profile => profile.name.toLowerCase() === newProfileName.toLowerCase())) {
      setError('Profile name already exists');
      return;
    }

    const newProfile = {
      id: Date.now(),
      name: newProfileName,
      type: newProfileType,
      avatar: avatarOptions[Math.floor(Math.random() * avatarOptions.length)],
      createdAt: new Date().toISOString(),
      isDefault: false,
      parentalControls: {
        maxRating: newProfileType === 'child' ? 'G' : 'PG-13',
        restrictedGenres: newProfileType === 'child' ? ['Horror', 'Thriller'] : []
      }
    };

    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    setNewProfileName('');
    setNewProfileType('adult');
    setShowAddProfile(false);
    setError('');
  };

  // Edit profile
  const handleEditProfile = (profile) => {
    setEditingProfile({ ...profile });
  };

  // Save edited profile
  const handleSaveEdit = () => {
    if (!editingProfile.name.trim()) {
      setError('Profile name cannot be empty');
      return;
    }

    if (profiles.some(p => p.id !== editingProfile.id && p.name.toLowerCase() === editingProfile.name.toLowerCase())) {
      setError('Profile name already exists');
      return;
    }

    const updatedProfiles = profiles.map(profile => 
      profile.id === editingProfile.id ? editingProfile : profile
    );
    
    saveProfiles(updatedProfiles);
    setEditingProfile(null);
    setError('');
  };

  // Delete profile
  const handleDeleteProfile = (profileId) => {
    if (profiles.length <= 1) {
      setError('Cannot delete the only profile');
      return;
    }

    if (profiles.find(p => p.id === profileId).isDefault) {
      setError('Cannot delete the default profile');
      return;
    }

    const updatedProfiles = profiles.filter(profile => profile.id !== profileId);
    saveProfiles(updatedProfiles);
  };

  // Set as default profile
  const handleSetDefault = (profileId) => {
    const updatedProfiles = profiles.map(profile => ({
      ...profile,
      isDefault: profile.id === profileId
    }));
    
    saveProfiles(updatedProfiles);
  };

  // Select profile and continue
  const handleSelectProfile = (profile) => {
    if (onSelectProfile) {
      onSelectProfile(profile);
    }
  };

  return (
    <div className="profiles-container">
      <h1 className="profiles-title">Who's Watching?</h1>
      
      {error && <div className="profiles-error">{error}</div>}
      
      <div className="profiles-grid">
        {profiles.map(profile => (
          <div key={profile.id} className="profile-item">
            {editingProfile && editingProfile.id === profile.id ? (
              // Edit mode
              <div className="profile-edit-form">
                <div className="profile-avatar-select">
                  <span className="current-avatar">{editingProfile.avatar}</span>
                  <div className="avatar-options">
                    {avatarOptions.map((avatar, index) => (
                      <button 
                        key={index}
                        className="avatar-option"
                        onClick={() => setEditingProfile({...editingProfile, avatar})}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
                
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                  placeholder="Profile Name"
                  className="profile-input"
                />
                
                <select 
                  value={editingProfile.type}
                  onChange={(e) => setEditingProfile({
                    ...editingProfile, 
                    type: e.target.value,
                    parentalControls: {
                      ...editingProfile.parentalControls,
                      maxRating: e.target.value === 'child' ? 'G' : 'PG-13',
                      restrictedGenres: e.target.value === 'child' ? ['Horror', 'Thriller'] : []
                    }
                  })}
                  className="profile-select"
                >
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                </select>
                
                <div className="profile-actions">
                  <button onClick={handleSaveEdit} className="profile-save-btn">Save</button>
                  <button onClick={() => setEditingProfile(null)} className="profile-cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                <button 
                  className="profile-avatar"
                  onClick={() => handleSelectProfile(profile)}
                >
                  {profile.avatar}
                  {profile.isDefault && <span className="default-badge">✓</span>}
                  {profile.type === 'child' && <span className="child-badge">👶</span>}
                </button>
                
                <div className="profile-name">{profile.name}</div>
                
                <div className="profile-actions">
                  <button onClick={() => handleEditProfile(profile)} className="profile-edit-btn">Edit</button>
                  {!profile.isDefault && (
                    <>
                      <button onClick={() => handleSetDefault(profile.id)} className="profile-default-btn">Set Default</button>
                      <button onClick={() => handleDeleteProfile(profile.id)} className="profile-delete-btn">Delete</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        
        {/* Add profile button */}
        {!showAddProfile && profiles.length < 5 && (
          <div className="profile-item add-profile">
            <button 
              className="add-profile-btn"
              onClick={() => setShowAddProfile(true)}
            >
              +
            </button>
            <div className="profile-name">Add Profile</div>
          </div>
        )}
      </div>
      
      {/* Add profile form */}
      {showAddProfile && (
        <div className="add-profile-form">
          <h2>Create Profile</h2>
          
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="Profile Name"
            className="profile-input"
          />
          
          <select 
            value={newProfileType}
            onChange={(e) => setNewProfileType(e.target.value)}
            className="profile-select"
          >
            <option value="adult">Adult</option>
            <option value="child">Child</option>
          </select>
          
          <div className="profile-form-actions">
            <button onClick={handleAddProfile} className="profile-save-btn">Create Profile</button>
            <button onClick={() => setShowAddProfile(false)} className="profile-cancel-btn">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="profiles-footer">
        <Link to="/preferences" className="profiles-settings-link">Manage Profiles</Link>
      </div>
    </div>
  );
};

export default UserProfiles;
