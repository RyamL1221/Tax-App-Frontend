# CloudFront CORS Configuration for Inline CSV Preview

## Problem

The frontend fetches CSV templates directly from CloudFront for inline preview using `fetch()`. Browsers block these cross-origin requests because the CloudFront distribution does not return `Access-Control-Allow-Origin` headers. Downloads via `<a download>` are unaffected since they bypass CORS.

## Solution

Add a CloudFront Response Headers Policy with CORS configuration, parameterized per environment.

## CloudFormation Template Changes

### 1. Add Parameter

```yaml
Parameters:
  FrontendOrigin:
    Type: String
    Description: The Vercel frontend origin for CORS
```

### 2. Add Response Headers Policy Resource

```yaml
CorsResponseHeadersPolicy:
  Type: AWS::CloudFront::ResponseHeadersPolicy
  Properties:
    ResponseHeadersPolicyConfig:
      Name: !Sub "${AWS::StackName}-cors-policy"
      CorsConfig:
        AccessControlAllowOrigins:
          Items:
            - !Ref FrontendOrigin
        AccessControlAllowMethods:
          Items:
            - GET
            - HEAD
            - OPTIONS
        AccessControlAllowHeaders:
          Items:
            - "*"
        AccessControlMaxAgeSec: 86400
        OriginOverride: true
```

### 3. Attach to CloudFront Distribution

Add this to your distribution's `DefaultCacheBehavior` (or whichever behavior serves CSV/PDF assets):

```yaml
ResponseHeadersPolicyId: !Ref CorsResponseHeadersPolicy
```

## SAM Config Values

### Dev (`samconfig.toml` dev section)

```toml
parameter_overrides = "FrontendOrigin=https://tax-app-git-dev-ryaml1221-ryan.vercel.app"
```

### Prod (`samconfig.toml` prod section)

```toml
parameter_overrides = "FrontendOrigin=https://the-tax-app.vercel.app"
```

## Deployment

1. Deploy the stack for the target environment
2. Wait for the CloudFront distribution to finish deploying (~2-5 minutes)
3. Verify inline CSV preview works on the frontend
