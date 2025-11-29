// Function to format a user and include their role info
const formatUserWithRole = (userDoc) => { 

  // If userDoc is empty, return nothing
  if (!userDoc) return null;

  // Convert the user document into a normal JS object
  const userObj = userDoc.toJSON();

  // Check if role_id exists and is an object (not just an ID)
  if (userObj.role_id && typeof userObj.role_id === "object") {

    // Save the role's name inside userObj
    userObj.role_name = userObj.role_id.name || null;

    // Replace the role_id object with just the role's ID
    userObj.role_id = userObj.role_id.id || userObj.role_id;
  } else {

    // If role_id is not an object, we don't have role name
    userObj.role_name = null;
  }

  // Return the final formatted user object
  return userObj;
};

// Export the function so other files can use it
module.exports = formatUserWithRole;
