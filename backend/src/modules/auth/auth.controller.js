import * as authService from './auth.service.js';

const handleServiceError = (error, res) => {
  if (error instanceof authService.CustomError) {
    return res.status(error.statusCode).json({ error: error.message, ...error.extraData });
  }
  console.error('Error interno:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
};

const getRequestMeta = (req) => ({
  ip: req.ip || req.connection?.remoteAddress || 'Desconocida',
  userAgent: req.headers['user-agent'] || 'Desconocido'
});

export const registerUser = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await authService.login(req.body, getRequestMeta(req));
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const getSessions = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await authService.getUserSessions(userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { userId } = req.user;
    const { sessionId } = req.body;
    await authService.revokeSessionById(sessionId, userId);
    res.json({ message: 'Sesión revocada exitosamente' });
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { token } = req;
    await authService.logoutSession(token);
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const result = await authService.googleAuthFlow(req.body, getRequestMeta(req));
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await authService.updateProfile(userId, req.body);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await authService.changePassword(userId, req.body);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const generate2FA = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await authService.generate2FA(userId);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const enable2FA = async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;
    const result = await authService.enable2FA(userId, token);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const verifyLogin2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;
    const result = await authService.verifyLogin2FA(userId, token, getRequestMeta(req));
    res.json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
};
