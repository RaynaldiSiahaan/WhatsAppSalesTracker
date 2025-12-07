import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../utils/constants.dart';
import '../providers/product_provider.dart';
import 'catalogue_screen.dart';
import 'selling_screen.dart';
import 'dashboard_screen.dart';
import 'consultation_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late PageController _pageController;
  late AnimationController _fabAnimationController;
  late Animation<double> _fabAnimation;

  final List<Widget> _screens = [
    const CatalogueScreen(),
    const SellingScreen(),
    const DashboardScreen(),
    const ConsultationScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    // FAB animation controller
    _fabAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _fabAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fabAnimationController, curve: Curves.easeInOut),
    );
    _fabAnimationController.forward();

    // Initialize product provider with fresh data for current user
    // Using reinitializeForNewUser to ensure we load the correct store's products
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ProductProvider>(context, listen: false).reinitializeForNewUser();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );

    // Trigger FAB animation
    _fabAnimationController.reset();
    _fabAnimationController.forward();

    // Haptic feedback
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
          HapticFeedback.lightImpact();
        },
        physics: const NeverScrollableScrollPhysics(), // Disable swipe navigation
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onItemTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppConstants.primaryBlue,
          unselectedItemColor: AppConstants.textGrey,
          selectedFontSize: 12,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
          elevation: 0,
          items: [
            BottomNavigationBarItem(
              icon: _buildNavIcon(Icons.inventory_2_outlined, Icons.inventory_2, 0),
              label: 'Katalog',
            ),
            BottomNavigationBarItem(
              icon: _buildNavIcon(Icons.shopping_cart_outlined, Icons.shopping_cart, 1),
              label: 'Jual',
            ),
            BottomNavigationBarItem(
              icon: _buildNavIcon(Icons.dashboard_outlined, Icons.dashboard, 2),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: _buildNavIcon(Icons.chat_outlined, Icons.chat, 3),
              label: 'Konsultasi',
            ),
            BottomNavigationBarItem(
              icon: _buildNavIcon(Icons.person_outline, Icons.person, 4),
              label: 'Profil',
            ),
          ],
        ),
      ),
      floatingActionButton: _currentIndex == 1
          ? ScaleTransition(
              scale: _fabAnimation,
              child: FloatingActionButton.extended(
                onPressed: () {
                  // Quick action for selling screen - could navigate to add product
                  HapticFeedback.mediumImpact();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Row(
                        children: [
                          Icon(Icons.add_circle_outline, color: Colors.white),
                          SizedBox(width: 12),
                          Text('Fitur quick add akan segera hadir'),
                        ],
                      ),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                      ),
                      backgroundColor: AppConstants.primaryBlue,
                    ),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Tambah Cepat'),
                backgroundColor: AppConstants.primaryBlue,
                foregroundColor: Colors.white,
                elevation: 4,
              ),
            )
          : null,
    );
  }

  Widget _buildNavIcon(IconData outlinedIcon, IconData filledIcon, int index) {
    final isSelected = _currentIndex == index;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      transitionBuilder: (child, animation) {
        return ScaleTransition(
          scale: animation,
          child: child,
        );
      },
      child: Icon(
        isSelected ? filledIcon : outlinedIcon,
        key: ValueKey<bool>(isSelected),
        size: isSelected ? 28 : 24,
      ),
    );
  }
}
