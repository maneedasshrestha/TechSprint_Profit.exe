import 'package:flutter/material.dart';
import '../models/notice.dart';

class OfficialNoticeCard extends StatelessWidget {
  final Notice notice;

  const OfficialNoticeCard({
    super.key,
    required this.notice,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Municipality Info
            Row(
              children: [
                // Municipality Logo
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFF2563EB).withOpacity(0.2),
                      width: 2,
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 26,
                    backgroundColor: Colors.white,
                    child: Image.asset(
                      Notice.municipalityLogo,
                      width: 45,
                      height: 45,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                const Color(0xFF2563EB),
                                const Color(0xFF1E3A8A),
                              ],
                            ),
                          ),
                          child: const Icon(
                            Icons.account_balance,
                            color: Colors.white,
                            size: 28,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Municipality Name and Time
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              Notice.municipalityName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1E293B),
                                letterSpacing: -0.3,
                              ),
                            ),
                          ),
                          if (Notice.isVerified) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(
                                color: Color(0xFF2563EB),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        notice.getTimeAgo(),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                // More Options Button
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(
                      Icons.more_horiz,
                      color: Color(0xFF64748B),
                    ),
                    onPressed: () {},
                    padding: const EdgeInsets.all(8),
                    constraints: const BoxConstraints(),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // Notice Title
            Text(
              notice.title,
              style: const TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                height: 1.3,
                color: Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),

            const SizedBox(height: 12),

            // Notice Content
            Text(
              notice.description,
              style: TextStyle(
                fontSize: 15,
                color: const Color(0xFF334155),
                height: 1.6,
                fontWeight: FontWeight.w400,
                letterSpacing: -0.2,
              ),
            ),

            // Image (if available)
            if (notice.imageUrl != null) ...[
              const SizedBox(height: 18),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  notice.imageUrl!,
                  width: double.infinity,
                  height: 320,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 320,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 48,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
