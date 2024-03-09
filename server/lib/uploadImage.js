const cloudinary = require("../utils/cloudinary");

const uploadImage = async (image) => {
  try {
    let result = await cloudinary.uploader.upload(image, {
      folder: "users",
    });
    if (result?.url) {
      result = result.url.replace("http", "https");
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = uploadImage;
