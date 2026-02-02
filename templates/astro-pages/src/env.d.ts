/// <reference types="astro/client" />

interface User {
	id: string;
	email: string;
	[key: string]: unknown;
}

declare namespace App {
	interface Locals {
		user?: User;
	}
}
