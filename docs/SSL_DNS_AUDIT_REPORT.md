# SSL/DNS Audit Report - ListForge App Runner Services

**Date**: December 12, 2025
**Status**: In Progress - Certificate Validation Pending

## Executive Summary

Conducted comprehensive audit of all App Runner services' SSL certificates, DNS configuration, and custom domain associations. Found and fixed critical DNS misconfiguration. SSL certificate issues identified and remediation in progress.

---

## Services Audited

| Service | Domain | App Runner Status | SSL Certificate Status |
|---------|--------|-------------------|----------------------|
| **Landing** | `list-forge.ai` | ✅ RUNNING | ❌ Serving wildcard cert |
| **Web** | `app.list-forge.ai` | ✅ RUNNING | ⏳ Validation pending |
| **API** | `api.list-forge.ai` | ✅ RUNNING | ✅ Valid custom cert |

---

## Issues Found & Actions Taken

### 1. Landing Page (list-forge.ai) - SSL Certificate Mismatch

**Issue:**
- Domain status shows as "active" in App Runner
- Certificate validation records show "SUCCESS"
- **BUT**: Actual SSL certificate being served is `*.us-east-1.awsapprunner.com` (wildcard)
- Should be serving a certificate for `list-forge.ai`

**Evidence:**
```bash
$ echo | openssl s_client -servername list-forge.ai -connect list-forge.ai:443
subject=CN=*.us-east-1.awsapprunner.com  # WRONG!
issuer=C=US, O=Amazon, CN=Amazon RSA 2048 M01
```

**Root Cause:**
- Custom domain association was recently updated via Terraform (changed image from web to landing)
- Service is currently in "updating" state
- SSL certificate provisioning may not have completed or bound correctly

**Actions Taken:**
- Verified DNS records are correct (App Runner managed A records in place)
- Verified certificate validation CNAMEs are present and validated
- Attempted to disassociate/re-associate domain (blocked by service update in progress)

**Next Steps:**
1. Wait for current service update to complete (~10-20 minutes)
2. If SSL certificate still incorrect, disassociate and re-associate custom domain:
   ```bash
   aws apprunner disassociate-custom-domain \
     --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808 \
     --domain-name list-forge.ai \
     --region us-east-1

   aws apprunner associate-custom-domain \
     --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808 \
     --domain-name list-forge.ai \
     --region us-east-1
   ```
3. Monitor certificate provisioning (can take 5-30 minutes)

---

### 2. Web App (app.list-forge.ai) - Missing DNS Records

**Issue:**
- Custom domain configured in App Runner
- Certificate validation stuck in "PENDING_VALIDATION"
- **ROOT CAUSE**: No DNS records existed for `app.list-forge.ai`

**DNS Records Missing:**
1. CNAME for `app.list-forge.ai` → App Runner DNS target
2. Certificate validation CNAME records (2 required)

**Actions Taken:** ✅ **FIXED**

Added DNS records via Route 53:
```json
{
  "app.list-forge.ai": {
    "Type": "CNAME",
    "Value": "stwysgc3yy.us-east-1.awsapprunner.com"
  },
  "_eea5b1ab3b93cb4ed27dc8a8333d97a5.app.list-forge.ai": {
    "Type": "CNAME",
    "Value": "_4fe6c9c17f04511c37f6fa9ec7be36b8.jkddzztszm.acm-validations.aws."
  },
  "_ff680e0b44c5bd4eba6c0d6cb268f3e9.2a57j78hsrstljvqlux8inqlkmoufug.app.list-forge.ai": {
    "Type": "CNAME",
    "Value": "_224a5bb4f4bcaab6c277dc54fc540ad7.jkddzztszm.acm-validations.aws."
  }
}
```

**Status:** ⏳ DNS records propagating, certificate validation in progress
**Expected Resolution:** 5-30 minutes for DNS propagation and ACM validation

---

### 3. API (api.list-forge.ai) - Working Correctly

**Status:** ✅ **ALL GOOD**

- DNS: CNAME to `pqjssm2cgt.us-east-1.awsapprunner.com`
- Certificate: Valid custom certificate for `api.list-forge.ai`
- Domain Status: `active`
- Certificate Validation: `SUCCESS`

```bash
$ echo | openssl s_client -servername api.list-forge.ai -connect api.list-forge.ai:443
subject=CN=api.list-forge.ai  ✓ CORRECT
issuer=C=US, O=Amazon, CN=Amazon RSA 2048 M01
notBefore=Dec  5 00:00:00 2025 GMT
notAfter=Jan  3 23:59:59 2027 GMT
```

---

## DNS Configuration Summary

### Route 53 Hosted Zone: `list-forge.ai`
**Zone ID:** `Z09864832NWGQZ2GSWPCQ`

#### Root Domain (list-forge.ai)
```
Type: A (Multiple records - App Runner managed)
Values:
  - 18.235.142.161
  - 18.215.60.223
  - 54.197.23.101
  - 54.208.31.153
  - 34.198.176.142

Certificate Validation CNAMEs:
  - _e3c0a13c06484db24f8ef8ad3cb75b8b.list-forge.ai → ACM validation
  - _0decf3a38512c1bb1ff0c00d86c00499.2a57j78hsrstljvqlux8inqlkmoufug.list-forge.ai → ACM validation
```

#### Web Subdomain (app.list-forge.ai)
```
Type: CNAME
Value: stwysgc3yy.us-east-1.awsapprunner.com

Certificate Validation CNAMEs: (Added 2025-12-12)
  - _eea5b1ab3b93cb4ed27dc8a8333d97a5.app.list-forge.ai → ACM validation
  - _ff680e0b44c5bd4eba6c0d6cb268f3e9.2a57j78hsrstljvqlux8inqlkmoufug.app.list-forge.ai → ACM validation
```

#### API Subdomain (api.list-forge.ai)
```
Type: CNAME
Value: pqjssm2cgt.us-east-1.awsapprunner.com

Certificate Validation CNAMEs:
  - _e1fe644654566c1d9e03aff76ca3604a.api.list-forge.ai → ACM validation
  - _f523e496ea0dbed9849898bb69607477.2a57j78hsrstljvqlux8inqlkmoufug.api.list-forge.ai → ACM validation
```

---

## App Runner Service Details

### Landing Service
```
Service ARN: arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808
DNS Target: gbenxqxr82.us-east-1.awsapprunner.com
Image: 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-landing:latest
Status: RUNNING (update in progress)
Custom Domain: list-forge.ai
Domain Status: active
```

### Web Service
```
Service ARN: arn:aws:apprunner:us-east-1:058264088602:service/listforge-web/fede0856787845bd8abc7833974b4ac7
DNS Target: stwysgc3yy.us-east-1.awsapprunner.com
Image: 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-web:latest
Status: RUNNING
Custom Domain: app.list-forge.ai
Domain Status: pending_certificate_dns_validation
```

### API Service
```
Service ARN: arn:aws:apprunner:us-east-1:058264088602:service/listforge-api/c8ab4b429650439eb7ea4aeb9fa72f7f
DNS Target: pqjssm2cgt.us-east-1.awsapprunner.com
Image: 058264088602.dkr.ecr.us-east-1.amazonaws.com/listforge-api:latest
Status: RUNNING
Custom Domain: api.list-forge.ai
Domain Status: active
```

---

## Monitoring & Verification Commands

### Check Domain Status
```bash
# Landing
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-landing/c5fd811f17174af3be64a824f94c9808 \
  --region us-east-1 \
  --query 'CustomDomains[0].Status'

# Web
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-web/fede0856787845bd8abc7833974b4ac7 \
  --region us-east-1 \
  --query 'CustomDomains[0].Status'

# API
aws apprunner describe-custom-domains \
  --service-arn arn:aws:apprunner:us-east-1:058264088602:service/listforge-api/c8ab4b429650439eb7ea4aeb9fa72f7f \
  --region us-east-1 \
  --query 'CustomDomains[0].Status'
```

### Check SSL Certificates
```bash
# Landing
echo | openssl s_client -servername list-forge.ai -connect list-forge.ai:443 2>/dev/null | openssl x509 -noout -subject -dates

# Web
echo | openssl s_client -servername app.list-forge.ai -connect app.list-forge.ai:443 2>/dev/null | openssl x509 -noout -subject -dates

# API
echo | openssl s_client -servername api.list-forge.ai -connect api.list-forge.ai:443 2>/dev/null | openssl x509 -noout -subject -dates
```

### Check DNS Resolution
```bash
dig +short list-forge.ai
dig +short app.list-forge.ai
dig +short api.list-forge.ai
```

---

## Timeline

- **13:49 UTC** - Terraform applied to update landing service image
- **13:53 UTC** - Landing service update completed (image now: listforge-landing:latest)
- **13:57 UTC** - Added missing DNS records for app.list-forge.ai
- **13:57 UTC** - Started monitoring certificate validation
- **Ongoing** - Waiting for:
  - Landing SSL certificate to bind correctly (~5-30 min)
  - Web app certificate validation to complete (~5-30 min)

---

## Expected Timeline

| Service | Issue | Expected Resolution |
|---------|-------|-------------------|
| Landing | SSL certificate mismatch | 5-30 minutes after service update completes |
| Web | Certificate validation pending | 5-30 minutes after DNS propagation |
| API | N/A | Already working ✓ |

---

## Security Best Practices Applied

✅ All domains using AWS Certificate Manager (ACM) for SSL/TLS
✅ Certificate validation via DNS (CNAME records)
✅ No self-signed certificates or certificate warnings (once fixed)
✅ TLS 1.2+ enforced by App Runner
✅ Automatic certificate renewal by ACM
✅ DNS managed through Route 53 with DNSSEC support available

---

## Recommendations

### Immediate Actions
1. **Monitor certificate validation progress** - Check every 5-10 minutes
2. **Once services stabilize**, verify all three domains serve correct SSL certificates
3. **Update browser cache** - Users may need to clear cache/hard refresh

### Future Improvements
1. **Add monitoring alerts** for certificate expiration (though ACM auto-renews)
2. **Implement health checks** that verify SSL certificate validity
3. **Document custom domain setup process** to avoid similar issues in future
4. **Consider using Terraform for DNS records** instead of manual Route 53 changes

### Terraform Improvements
```hcl
# Add to modules/app-service/main.tf
# Automatically create Route 53 records for custom domains
resource "aws_route53_record" "custom_domain_cname" {
  count   = var.domain != null && !var.is_apex_domain ? 1 : 0
  zone_id = var.zone_id
  name    = var.domain
  type    = "CNAME"
  ttl     = 300
  records = [aws_apprunner_service.main.service_url]
}
```

---

## Contact & Next Steps

**Current Status**: Waiting for certificate validation (automated process)

**Next Check**: 5-10 minutes from now

**If Issues Persist**:
1. Disassociate and re-associate custom domains
2. Check CloudWatch logs for App Runner services
3. Verify ACM certificate status in AWS Console
4. Open AWS Support ticket if certificate validation fails after 1 hour

---

## References

- [App Runner Custom Domains Documentation](https://docs.aws.amazon.com/apprunner/latest/dg/manage-custom-domains.html)
- [ACM Certificate Validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [Route 53 DNS Configuration](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/)
- [App Runner SSL/TLS](https://docs.aws.amazon.com/apprunner/latest/dg/network-tls.html)

