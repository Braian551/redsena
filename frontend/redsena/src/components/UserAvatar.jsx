function getInitials(user) {
  const label = user?.displayName || user?.email || 'RedSENA'
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function UserAvatar({ user, className = 'size-10', label = '' }) {
  if (user?.photoURL) {
    return <img className={`${className} rounded-full bg-mint/30 object-cover`} src={user.photoURL} alt={label} />
  }

  return (
    <span
      className={`${className} grid place-items-center rounded-full bg-mint/60 text-sm font-extrabold text-[#276b58]`}
      aria-label={label || user?.displayName || user?.email || 'Avatar'}
    >
      {getInitials(user)}
    </span>
  )
}

export { UserAvatar }
