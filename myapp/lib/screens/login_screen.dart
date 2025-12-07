import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import 'main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();

  bool _isLogin = true;
  bool _obscurePassword = true;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    bool success;

    if (_isLogin) {
      success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      success = await authProvider.register(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (success) {
        // Auto login after register
        success = await authProvider.login(
          _emailController.text.trim(),
          _passwordController.text,
        );
      }
    }

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
      );
    } else if (authProvider.error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(authProvider.error!)),
            ],
          ),
          backgroundColor: AppConstants.errorRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
          ),
        ),
      );
    }
  }

  void _toggleMode() {
    setState(() {
      _isLogin = !_isLogin;
      _animationController.reset();
      _animationController.forward();
    });
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email harus diisi';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Format email tidak valid';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppConstants.primaryBlue,
              AppConstants.primaryBlue.withOpacity(0.8),
              AppConstants.accentBlue,
            ],
          ),
        ),
        child: SafeArea(
          child: GestureDetector(
            onTap: () => FocusScope.of(context).unfocus(),
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppConstants.paddingLarge,
                  vertical: AppConstants.paddingMedium,
                ),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo Card
                      Hero(
                        tag: 'app_logo',
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(30),
                            child: Image.asset(
                              'assets/images/sedya_rasa_logo.png',
                              width: 120,
                              height: 120,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                // Fallback ke icon jika gambar tidak ada
                                return Icon(
                                  Icons.restaurant_menu,
                                  size: 56,
                                  color: AppConstants.primaryBlue,
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // App Title
                      const Text(
                        'Sedya Rasa',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isLogin ? 'Selamat datang kembali!' : 'Mari bergabung bersama kami',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white.withOpacity(0.9),
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                      const SizedBox(height: 40),

                      // Login Form Card
                      Container(
                        padding: const EdgeInsets.all(AppConstants.paddingLarge),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              // Form Title
                              Text(
                                _isLogin ? 'Masuk' : 'Daftar',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: AppConstants.textDark,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Email Field
                              TextFormField(
                                controller: _emailController,
                                focusNode: _emailFocusNode,
                                decoration: InputDecoration(
                                  labelText: 'Email',
                                  hintText: 'Masukkan email Anda',
                                  prefixIcon: Icon(Icons.email_outlined, color: AppConstants.primaryBlue),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.textGrey.withOpacity(0.3)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.textGrey.withOpacity(0.3)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.primaryBlue, width: 2),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.errorRed),
                                  ),
                                  filled: true,
                                  fillColor: AppConstants.backgroundGrey.withOpacity(0.3),
                                ),
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                onFieldSubmitted: (_) {
                                  FocusScope.of(context).requestFocus(_passwordFocusNode);
                                },
                                validator: _validateEmail,
                              ),
                              const SizedBox(height: AppConstants.paddingMedium),

                              // Password Field
                              TextFormField(
                                controller: _passwordController,
                                focusNode: _passwordFocusNode,
                                decoration: InputDecoration(
                                  labelText: 'Password',
                                  hintText: 'Masukkan password Anda',
                                  prefixIcon: Icon(Icons.lock_outline, color: AppConstants.primaryBlue),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                      color: AppConstants.textGrey,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _obscurePassword = !_obscurePassword;
                                      });
                                    },
                                  ),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.textGrey.withOpacity(0.3)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.textGrey.withOpacity(0.3)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.primaryBlue, width: 2),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                    borderSide: BorderSide(color: AppConstants.errorRed),
                                  ),
                                  filled: true,
                                  fillColor: AppConstants.backgroundGrey.withOpacity(0.3),
                                ),
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _submit(),
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Password harus diisi';
                                  }
                                  if (value.length < 6) {
                                    return 'Password minimal 6 karakter';
                                  }
                                  return null;
                                },
                              ),

                              // Forgot Password (only for login)
                              if (_isLogin) ...[
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: const Text('Fitur lupa password akan segera hadir'),
                                          behavior: SnackBarBehavior.floating,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                          ),
                                        ),
                                      );
                                    },
                                    child: Text(
                                      'Lupa Password?',
                                      style: TextStyle(
                                        color: AppConstants.primaryBlue,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ),
                              ],

                              const SizedBox(height: 24),

                              // Submit Button
                              Consumer<AuthProvider>(
                                builder: (context, auth, _) {
                                  return SizedBox(
                                    width: double.infinity,
                                    height: 56,
                                    child: ElevatedButton(
                                      onPressed: auth.isLoading ? null : _submit,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppConstants.primaryBlue,
                                        foregroundColor: Colors.white,
                                        disabledBackgroundColor: AppConstants.textGrey.withOpacity(0.5),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                                        ),
                                        elevation: 4,
                                        shadowColor: AppConstants.primaryBlue.withOpacity(0.4),
                                      ),
                                      child: auth.isLoading
                                          ? const SizedBox(
                                              height: 24,
                                              width: 24,
                                              child: CircularProgressIndicator(
                                                color: Colors.white,
                                                strokeWidth: 2.5,
                                              ),
                                            )
                                          : Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Text(
                                                  _isLogin ? 'Masuk' : 'Daftar',
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                const Icon(Icons.arrow_forward, size: 20),
                                              ],
                                            ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Toggle Login/Register
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _isLogin ? 'Belum punya akun?' : 'Sudah punya akun?',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                              ),
                            ),
                            TextButton(
                              onPressed: _toggleMode,
                              child: Text(
                                _isLogin ? 'Daftar' : 'Masuk',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                  decorationColor: Colors.white,
                                  decorationThickness: 2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
