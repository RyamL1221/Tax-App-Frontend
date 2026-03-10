'use client';

import { useState } from 'react';

export default function TestPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: '50px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Password Toggle Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Password:
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              paddingRight: '50px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="Type a password"
          />
          <button
            type="button"
            onClick={() => {
              console.log('Button clicked! Current state:', showPassword);
              setShowPassword(!showPassword);
              console.log('New state:', !showPassword);
            }}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              fontSize: '20px'
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '4px' }}>
        <h3>Debug Info:</h3>
        <p>Show Password: {showPassword ? 'TRUE' : 'FALSE'}</p>
        <p>Input Type: {showPassword ? 'text' : 'password'}</p>
        <p>Password Value: {password || '(empty)'}</p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Type something in the password field</li>
          <li>Click the eye icon button</li>
          <li>Check the console for logs</li>
          <li>Watch the Debug Info section update</li>
        </ol>
      </div>
    </div>
  );
}
