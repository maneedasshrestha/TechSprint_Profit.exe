import 'package:flutter/material.dart';
import '../models/notice.dart';

class OfficialNoticeCard extends StatefulWidget {
  final Notice notice;

  const OfficialNoticeCard({super.key, required this.notice});

  @override
  State<OfficialNoticeCard> createState() => _OfficialNoticeCardState();
}

class _OfficialNoticeCardState extends State<OfficialNoticeCard>
    with SingleTickerProviderStateMixin {
  bool hasLiked = false;
  late int likeCount;
  int _replyCount = 1;
  AnimationController? _animationController;
  Animation<double>? _scaleAnimation;

  @override
  void initState() {
    super.initState();
    likeCount = 2;

    // Initialize animations
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _animationController!, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _animationController?.dispose();
    super.dispose();
  }

  void _handleLike() {
    setState(() {
      if (hasLiked) {
        hasLiked = false;
        likeCount--;
      } else {
        hasLiked = true;
        likeCount++;
        _animationController?.forward().then((_) {
          _animationController?.reverse();
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 1,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header section
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Profile picture with verification
                Stack(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.grey.shade300,
                          width: 2,
                        ),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          Notice.municipalityLogo,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: const Color(0xFF1877F2),
                              child: const Icon(
                                Icons.account_balance,
                                color: Colors.white,
                                size: 25,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    if (Notice.isVerified)
                      Positioned(
                        bottom: -2,
                        right: -2,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1877F2),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                // Organization info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            Notice.municipalityName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1a1a1a),
                            ),
                          ),
                          if (Notice.isVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified,
                              color: Color(0xFF1877F2),
                              size: 16,
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.notice.getTimeAgo(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF65676b),
                        ),
                      ),
                    ],
                  ),
                ),
                // More options button
                Container(
                  padding: const EdgeInsets.all(8),
                  child: Icon(
                    Icons.more_horiz,
                    color: Colors.grey.shade600,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),

          // Post content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Post title
                Text(
                  widget.notice.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1a1a1a),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),

                // Main content
                Text(
                  widget.notice.description,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF050505),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Post image
          if (widget.notice.imageUrl != null) ...[
            Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Colors.grey.shade200,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  widget.notice.imageUrl!,
                  width: double.infinity,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 300,
                      color: Colors.grey.shade300,
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 40,
                          color: Colors.grey,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Action buttons row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                // Like button with animation
                GestureDetector(
                  onTap: _handleLike,
                  child: AnimatedBuilder(
                    animation: _scaleAnimation!,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: hasLiked
                            ? const Color(0xFF2E4F99)
                            : Colors.transparent,
                        border: hasLiked
                            ? null
                            : Border.all(
                                color: const Color(0xFF2E4F99),
                                width: 1.5,
                              ),
                        borderRadius: BorderRadius.circular(25),
                        boxShadow: hasLiked
                            ? [
                                BoxShadow(
                                  color: const Color(
                                    0xFF2E4F99,
                                  ).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            hasLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                            color: hasLiked
                                ? Colors.white
                                : const Color(0xFF2E4F99),
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 300),
                            style: TextStyle(
                              color: hasLiked
                                  ? Colors.white
                                  : const Color(0xFF2E4F99),
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                            child: Text(hasLiked ? 'Liked' : 'Like'),
                          ),
                        ],
                      ),
                    ),
                    builder: (context, child) {
                      return Transform.scale(
                        scale: hasLiked ? _scaleAnimation!.value : 1.0,
                        child: child,
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                // Comment button
                GestureDetector(
                  onTap: () {
                    // Handle comment action
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F0FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.mode_comment_rounded,
                      color: Color(0xFF2E4F99),
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Share button
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Share functionality coming soon!'),
                      ),
                    );
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F0FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send_rounded,
                      color: Color(0xFF2E4F99),
                      size: 20,
                    ),
                  ),
                ),
                const Spacer(),
                // Comments and Thread indicator
                GestureDetector(
                  onTap: () {
                    // Handle view replies action
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F0FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$_replyCount ${_replyCount == 1 ? 'reply' : 'replies'}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF2E4F99),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 10,
                          color: Color(0xFF2E4F99),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
