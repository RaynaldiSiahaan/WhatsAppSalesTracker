import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class KolosalApiService {
  static const String baseUrl = 'https://api.kolosal.ai/v1';
  static const String model = 'Qwen 3 30BA3B';
  
  String get apiKey => dotenv.env['KOLOSAL_API_KEY'] ?? '';

  Future<String> generateProductCaption(String productName, double price, int quantity) async {
    try {
      final messages = [
        {
          'role': 'system',
          'content': 'Kamu adalah asisten AI yang membantu ibu-ibu penjual UMKM membuat caption menarik untuk WhatsApp Story. Buat caption yang singkat (maksimal 2 baris), menarik, pakai emoji, dan persuasif untuk produk yang dijual. Fokus pada manfaat produk dan ajakan beli.'
        },
        {
          'role': 'user',
          'content': 'Buatkan caption WhatsApp Story untuk menjual $quantity pcs produk: $productName dengan harga Rp ${price.toStringAsFixed(0)} per pcs. Buat semenarik mungkin!'
        }
      ];

      final response = await http.post(
        Uri.parse('$baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: jsonEncode({
          'model': model,
          'messages': messages,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate caption: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error calling Kolosal AI: $e');
    }
  }

  // Existing chatbot function
  Future<String> sendChatMessage(List<Map<String, String>> messages) async {
    try {
      final messagesWithSystem = [
        {
          'role': 'system',
          'content': 'Kamu adalah asisten AI yang sangat terspesialisasi dalam membantu UMKM untuk mengembangkan bisnis mereka di Indonesia. Jawab dengan bahasa Indonesia dan berikan saran yang praktis serta relevan dengan konteks lokal. Gunakan cara menjawab menggunakan poin-poin dan maksimal 150 kata. Target audiens kamu adalah ibu-ibu yang menjual barang mereka lewat whatsapp story. Kamu harus dapat menjawab pertanyaan basic seperti cara promosi, tips penjualan, ide produk, dan strategi pemasaran digital sederhana.'
        },
        ...messages,
      ];

      final response = await http.post(
        Uri.parse('$baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: jsonEncode({
          'model': model,
          'messages': messagesWithSystem,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to get response: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error calling API: $e');
    }
  }
}
