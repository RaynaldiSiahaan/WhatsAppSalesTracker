import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../providers/product_provider.dart';
import '../models/product.dart';
import '../services/kolosal_api_service.dart';
import '../utils/constants.dart';

class SellingScreen extends StatelessWidget {
  const SellingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundGrey,
      appBar: AppBar(
        title: const Text('Jual Produk'),
        backgroundColor: AppConstants.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: Consumer<ProductProvider>(
        builder: (context, provider, _) {
          final availableProducts = provider.products
              .where((p) => p.stockQuantity > 0)
              .toList();

          if (availableProducts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Tidak ada produk tersedia',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(AppConstants.paddingMedium),
            itemCount: availableProducts.length,
            itemBuilder: (context, index) {
              final product = availableProducts[index];
              return _ProductSellingCard(product: product);
            },
          );
        },
      ),
    );
  }
}

class _ProductSellingCard extends StatefulWidget {
  final Product product;

  const _ProductSellingCard({required this.product});

  @override
  State<_ProductSellingCard> createState() => _ProductSellingCardState();
}

class _ProductSellingCardState extends State<_ProductSellingCard> {
  int _selectedQuantity = 1;

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Row(
          children: [
            // Product Image
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
              ),
              child: widget.product.imagePath != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
                      child: Image.file(
                        File(widget.product.imagePath!),
                        fit: BoxFit.cover,
                      ),
                    )
                  : Icon(Icons.image, size: 40, color: Colors.grey[400]),
            ),
            const SizedBox(width: AppConstants.paddingMedium),

            // Product Info & Quantity Selector
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatter.format(widget.product.price),
                    style: TextStyle(
                      color: AppConstants.primaryBlue,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Stok: ${widget.product.stockQuantity}',
                    style: TextStyle(
                      color: AppConstants.textGrey,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Quantity Selector
                  Row(
                    children: [
                      Text(
                        'Jumlah Jual:',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppConstants.textGrey,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppConstants.primaryBlue),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: _selectedQuantity > 1
                                  ? () => setState(() => _selectedQuantity--)
                                  : null,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                            Container(
                              width: 40,
                              alignment: Alignment.center,
                              child: Text(
                                '$_selectedQuantity',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: _selectedQuantity < widget.product.stockQuantity
                                  ? () => setState(() => _selectedQuantity++)
                                  : null,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // WhatsApp Share Button
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF25D366), // WhatsApp green
                  borderRadius: BorderRadius.circular(AppConstants.radiusSmall),
                ),
                child: const Icon(
                  Icons.share,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              onPressed: () => _shareToWhatsApp(context),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _shareToWhatsApp(BuildContext context) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Membuat caption...'),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      // Generate AI caption
      final aiService = KolosalApiService();
      final caption = await aiService.generateProductCaption(
        widget.product.name,
        widget.product.price,
        widget.product.stockQuantity - _selectedQuantity,
      );

      if (!context.mounted) return;
      Navigator.pop(context); // Close loading

      // Show caption review dialog
      _showCaptionReview(context, caption);
    } catch (e) {
      if (!context.mounted) return;
      Navigator.pop(context); // Close loading

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error generate caption: $e'),
          backgroundColor: AppConstants.errorRed,
        ),
      );
    }
  }

  void _showCaptionReview(BuildContext context, String caption) {
    final controller = TextEditingController(text: caption);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Review Caption'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Caption otomatis dari AI:',
                style: TextStyle(
                  color: AppConstants.textGrey,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: controller,
                maxLines: 5,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Edit caption jika perlu...',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              await _shareWithCaption(context, controller.text);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
            ),
            icon: const Icon(Icons.send, color: Colors.white),
            label: const Text(
              'Bagikan',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _shareWithCaption(BuildContext context, String caption) async {
    try {
      // Copy caption to clipboard
      await Clipboard.setData(ClipboardData(text: caption));

      // Record sale
      if (widget.product.id != null) {
        await Provider.of<ProductProvider>(context, listen: false)
            .recordSale(widget.product.id!, _selectedQuantity);
      }

      if (!context.mounted) return;
      Navigator.pop(context); // Close dialog

      // Share image
      if (widget.product.imagePath != null) {
        await Share.shareXFiles(
          [XFile(widget.product.imagePath!)],
          text: caption,
        );
      } else {
        await Share.share(caption);
      }

      if (!context.mounted) return;

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Caption tersalin! Paste di WhatsApp Story 📋✨'),
          backgroundColor: AppConstants.successGreen,
          duration: const Duration(seconds: 3),
        ),
      );

      // Reset quantity
      setState(() {
        _selectedQuantity = 1;
      });
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppConstants.errorRed,
        ),
      );
    }
  }
}
