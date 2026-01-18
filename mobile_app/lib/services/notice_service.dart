import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/notice.dart';

class NoticeService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Fetch all notices
  Future<List<Notice>> getNotices() async {
    try {
      final response = await _supabase
          .from('notices')
          .select()
          .eq('status', 'published')
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false);

      return (response as List).map((json) => Notice.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching notices: $e');
      return [];
    }
  }

  // Fetch a single notice by ID
  Future<Notice?> getNoticeById(String noticeId) async {
    try {
      final response = await _supabase
          .from('notices')
          .select()
          .eq('id', noticeId)
          .single();

      return Notice.fromJson(response);
    } catch (e) {
      print('Error fetching notice: $e');
      return null;
    }
  }

  // Fetch pinned notices only
  Future<List<Notice>> getPinnedNotices() async {
    try {
      final response = await _supabase
          .from('notices')
          .select()
          .eq('status', 'published')
          .eq('is_pinned', true)
          .order('created_at', ascending: false);

      return (response as List).map((json) => Notice.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching pinned notices: $e');
      return [];
    }
  }
}
