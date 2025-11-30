import bcrypt from 'bcrypt';
import { config } from './config';

export class AuthService {
	private static passwordHash: string | null = null;
	private static initialized = false;

	static async initialize(): Promise<void> {
		if (this.initialized) return;

		if (!config.auth.enabled) {
			console.log('Authentication disabled');
			this.initialized = true;
			return;
		}

		if (!config.auth.adminPassword) {
			throw new Error('ADMIN_PASSWORD must be set when AUTH_ENABLED=true');
		}

		// Hash password at startup
		console.log('Hashing admin password...');
		this.passwordHash = await bcrypt.hash(config.auth.adminPassword, 10);
		console.log('Authentication enabled - Admin password configured');
		this.initialized = true;
	}

	static async verifyPassword(password: string): Promise<boolean> {
		if (!this.initialized) {
			await this.initialize();
		}

		if (!this.passwordHash) {
			throw new Error('Authentication not initialized');
		}

		return bcrypt.compare(password, this.passwordHash);
	}

	static isEnabled(): boolean {
		return config.auth.enabled;
	}
}
