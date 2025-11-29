// DTO (Data Transfer Object) helpers for properties and locations

// Convert a Mongoose document or a plain object into a plain JS object
const toPlainObject = (docOrObj) => {
  // If the value is null/undefined, return null
  if (!docOrObj) return null;
  // If it has a toJSON function (Mongoose document), call it to get plain object
  if (typeof docOrObj.toJSON === "function") {
    return docOrObj.toJSON();
  }
  // Otherwise assume it's already a plain object
  return docOrObj;
};

// Format a location into a clean response DTO
const LocationResponseDTO = (location) => {
  // Ensure we are working with a plain object
  const loc = toPlainObject(location);
  if (!loc) return null;

  // Use loc.id if present, otherwise convert _id to string if possible
  const id = loc.id || (loc._id && loc._id.toString ? loc._id.toString() : loc._id);

  // Return only the fields we want to expose to the client
  return {
    id,
    street_address: loc.street_address,
    area_name: loc.area_name,
    city: loc.city,
    postal_code: loc.postal_code,
    latitude: loc.latitude,
    longitude: loc.longitude,
    is_active: loc.is_active,
    created_date: loc.created_date,
    updated_date: loc.updated_date,
  };
};

// Format a property (with nested location) into a response DTO
const PropertyResponseDTO = (property) => {
  // Ensure property is a plain object
  const p = toPlainObject(property);
  if (!p) return null;

  // Location might be embedded as p.location or referenced as p.location_id
  const location = p.location || p.location_id;
  // Reuse LocationResponseDTO to format the nested location
  const locationDto = LocationResponseDTO(location);

  // Use p.id if present, otherwise convert _id to string if possible
  const id = p.id || (p._id && p._id.toString ? p._id.toString() : p._id);

  // Return only the fields we want the frontend to see for a property
  return {
    id,
    property_title: p.property_title,
    detailed_description: p.detailed_description,
    image_id: p.image_id,
    rent: p.rent,
    is_active: p.is_active,
    location: locationDto,
    user_id: p.user_id,
    property_types_id: p.property_types_id,
    status_id: p.status_id,
    created_date: p.created_date,
    updated_date: p.updated_date,
  };
};

// For now, request DTOs just pass through the received body/location
// You can later add validation or transformations here if needed
const PropertyRequestDTO = (body) => body;

const LocationRequestDTO = (location) => location;

// Export all DTO helpers for use in controllers/services
module.exports = {
  PropertyRequestDTO,
  LocationRequestDTO,
  PropertyResponseDTO,
  LocationResponseDTO,
};
