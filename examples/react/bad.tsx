import React from 'react';

export const UserProfile = ({ user }) => {
    return (
        <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <img src={user.avatarUrl} />
            <div onClick={() => console.log('clicked')} style={{ cursor: 'pointer' }}>
                {user.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {user.posts.map(post => (
                    <div key={Math.random()} style={{ border: '1px solid black' }}>
                        {post.title}
                    </div>
                ))}
            </div>
            <input type="text" onChange={(e) => window.location.hash = e.target.value} />
        </div>
    );
};
