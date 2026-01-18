class Notice {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final DateTime createdAt;
  final bool isPinned;
  final String status;

  // Constant values for Bhaktapur Municipality
  static const String municipalityName = 'Bhaktapur Municipality';
  static const String municipalityLogo = 'assets/images/bhaktapur_logo.png';
  static const bool isVerified = true;

  Notice({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    required this.createdAt,
    this.isPinned = false,
    this.status = 'published',
  });

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      imageUrl: json['image_url'],
      createdAt: DateTime.parse(json['created_at']),
      isPinned: json['is_pinned'] ?? false,
      status: json['status'] ?? 'published',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'image_url': imageUrl,
      'created_at': createdAt.toIso8601String(),
      'is_pinned': isPinned,
      'status': status,
    };
  }

  String getTimeAgo() {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()} year${(difference.inDays / 365).floor() > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()} month${(difference.inDays / 30).floor() > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
