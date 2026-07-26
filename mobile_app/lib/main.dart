import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
  runApp(const StylishToothApp());
}

final supabase = Supabase.instance.client;

class StylishToothApp extends StatelessWidget {
  const StylishToothApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Стильний зубець',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF242F35),
        ),
        useMaterial3: true,
      ),
      home: const SizedBox.shrink(),
    );
  }
}
