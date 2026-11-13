import 'package:material_ui/material_ui.dart';

import 'core/app_state.dart';
import 'ui/common.dart';
import 'ui/customers_screen.dart';
import 'ui/dashboard_screen.dart';
import 'ui/login_screen.dart';
import 'ui/orders_screen.dart';

class ConfeitiApp extends StatelessWidget {
  const ConfeitiApp({super.key, required this.state});
  final AppState state;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: state,
    builder: (context, _) => MaterialApp(
      // Changing identity/company also discards the previous navigation stack.
      key: ValueKey('${state.session?.companyId}:${state.revision}'),
      title: 'Confeiti',
      debugShowCheckedModeBanner: false,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff8d3157)),
        scaffoldBackgroundColor: const Color(0xfffff8f3),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xfffff8f3),
          centerTitle: false,
        ),
        cardTheme: const CardThemeData(elevation: 0, color: Colors.white),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      home: state.loading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : state.startupError != null
          ? Scaffold(
              body: SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off_outlined, size: 48),
                        const SizedBox(height: 16),
                        Text(state.startupError!, textAlign: TextAlign.center),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: state.restore,
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
          : state.session == null
          ? LoginScreen(state: state)
          : HomeScreen(state: state),
    ),
  );
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.state});
  final AppState state;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  bool _busy = false;
  static const _titles = ['Visão geral', 'Pedidos', 'Clientes', 'Minha conta'];
  Future<void> _logout() async {
    setState(() => _busy = true);
    try {
      await widget.state.logout();
    } catch (error) {
      if (mounted) showError(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _switch(String? id) async {
    if (id == null || id == widget.state.session!.companyId) return;
    try {
      await widget.state.switchCompany(id);
    } catch (error) {
      if (mounted) showError(context, error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.state.session!;
    final account = ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(
          Icons.bakery_dining_outlined,
          size: 64,
          color: Color(0xff8d3157),
        ),
        const SizedBox(height: 24),
        Text(session.name, style: Theme.of(context).textTheme.headlineSmall),
        Text(session.email),
        const SizedBox(height: 24),
        DropdownButtonFormField<String>(
          initialValue: session.companyId,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Empresa ativa'),
          items: session.companies
              .map(
                (company) => DropdownMenuItem(
                  value: company.id,
                  child: Text(
                    '${company.name}${company.inactive ? ' (inativa)' : ''}',
                  ),
                ),
              )
              .toList(),
          onChanged: _busy ? null : _switch,
        ),
        const SizedBox(height: 24),
        if (session.inactive)
          const Text(
            'Esta empresa está inativa. Escolha outra empresa ou recupere-a no sistema web.',
          ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: _busy ? null : _logout,
          icon: const Icon(Icons.logout),
          label: Text(_busy ? 'Saindo…' : 'Sair da conta'),
        ),
      ],
    );
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_titles[_tab]),
            Text(
              session.companyName,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
      body: session.inactive
          ? account
          : switch (_tab) {
              0 => DashboardScreen(api: widget.state.api),
              1 => OrdersScreen(api: widget.state.api),
              2 => CustomersScreen(api: widget.state.api),
              _ => account,
            },
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (tab) => setState(() => _tab = tab),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Pedidos',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            label: 'Clientes',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Conta',
          ),
        ],
      ),
    );
  }
}
