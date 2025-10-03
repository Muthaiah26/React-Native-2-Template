import JWT from "react-native-pure-jwt";

const decodeJWT = async (token, secret) => {
  try {
    const decoded = await JWT.decode(token, secret, { skipValidation: true });
    return decoded;
  } catch (err) {
    console.warn("JWT decode failed", err);
    return null;
  }
};
