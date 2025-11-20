const formatUserWithRole = (userDoc) => {
  if (!userDoc) return null;
  const userObj = userDoc.toJSON();

  if (userObj.role_id && typeof userObj.role_id === "object") {
    userObj.role_name = userObj.role_id.name || null;
    userObj.role_id = userObj.role_id.id || userObj.role_id;
  } else {
    userObj.role_name = null;
  }

  return userObj;
};

module.exports = formatUserWithRole;
