import helmet from 'helmet';

const securityMiddleware = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
});

export default securityMiddleware;
