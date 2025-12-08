export const rookAuthHeader = () => {
  const authString = Buffer.from(
    `${process.env.ROOK_CLIENT_UUID}:${process.env.ROOK_CLIENT_SECRET}`
  ).toString("base64");

  return {
    "User-Agent": "MyApp/1.0",
    Authorization: `Basic ${authString}`,
  };
};
