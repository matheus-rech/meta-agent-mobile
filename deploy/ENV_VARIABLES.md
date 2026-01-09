# Environment Variables

Copy these variables to your `.env` file in the deploy directory.

## Database
```
POSTGRES_PASSWORD=your_secure_password_here
```

## Security
```
API_SECRET_KEY=your_api_secret_key_here
JWT_SECRET=your_jwt_secret_here
```

## OAuth (for user authentication)
```
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
```

## S3-Compatible Storage
```
S3_BUCKET=meta-agent-files
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_ENDPOINT=https://s3.amazonaws.com
```

## CORS
```
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

## Domains (for Caddy)
```
GLASS_DOMAIN=api.yourdomain.com
APP_DOMAIN=app.yourdomain.com
WEB_DOMAIN=www.yourdomain.com
```

## Logging
```
LOG_LEVEL=info
```
