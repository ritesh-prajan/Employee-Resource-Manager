import react from 'react';

export default function UserAvatar({name, size=32,title}){

    const parts=name.trim().split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase(): parts[0].substring(0,2).toUpperCase();
    
    return(
        <div className="user-initials-badge" title={title} style={{width: size,height: size,fontSize: size * 0.35}}>
            {initials}
        </div>
    );
}