/** Fields always excluded from req.user in guards (auth layer) */
export const USER_SELECT_FIELDS = '-password -refreshToken -__v';

/**
 * Fields projected in service queries.
 * Keeps otp/otpExpires/resetExpires internal.
 * createdAt/updatedAt are kept so the GQL UserType can expose them.
 */

export const USER_LIST_FIELDS = '-password -refreshToken -otp -otpExpires -otpVerified -resetExpires -__v';

export const DEFAULT_PAGE   = 1;
export const DEFAULT_LIMIT  = 10;
export const BCRYPT_ROUNDS  = 10;
export const OTP_LENGTH     = 6;
