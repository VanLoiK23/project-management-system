const getInitials = (fullName) => {
  if (!fullName) return "U";

  const words = fullName.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  const firstLetter = words[0].charAt(0);
  const lastLetter = words[words.length - 1].charAt(0);

  return (firstLetter + lastLetter).toUpperCase();
};

export default getInitials;
