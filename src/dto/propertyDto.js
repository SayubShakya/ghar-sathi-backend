const toPlainObject = (docOrObj) => {
  if (!docOrObj) return null;
  if (typeof docOrObj.toJSON === "function") {
    return docOrObj.toJSON();
  }
  return docOrObj;
};

const LocationResponseDTO = (location) => {
  const loc = toPlainObject(location);
  if (!loc) return null;

  const id = loc.id || (loc._id && loc._id.toString ? loc._id.toString() : loc._id);

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

const PropertyResponseDTO = (property) => {
  const p = toPlainObject(property);
  if (!p) return null;

  const location = p.location || p.location_id;
  const locationDto = LocationResponseDTO(location);

  const id = p.id || (p._id && p._id.toString ? p._id.toString() : p._id);

  return {
    id,
    property_title: p.property_title,
    detailed_description: p.detailed_description,
    cover_image_url: p.cover_image_url,
    rent: p.rent,
    is_active: p.is_active,
    location: locationDto,
    user_id: p.user_id,
    property_types_id: p.property_types_id,
    status: p.status,
    created_date: p.created_date,
    updated_date: p.updated_date,
  };
};

const PropertyRequestDTO = (body) => body;

const LocationRequestDTO = (location) => location;

module.exports = {
  PropertyRequestDTO,
  LocationRequestDTO,
  PropertyResponseDTO,
  LocationResponseDTO,
};
