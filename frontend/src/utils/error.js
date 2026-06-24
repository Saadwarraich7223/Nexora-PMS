const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  const payloadMessage = error?.message || error?.payload?.message;
  if (payloadMessage) return payloadMessage;

  const responseMessage = error.response?.data?.message;
  if (responseMessage) return responseMessage;

  const responseError = error.response?.data?.error;
  if (responseError) return responseError;

  return error.message || fallback;
};

export default getErrorMessage;
