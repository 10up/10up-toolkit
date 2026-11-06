/**
 * Lets tests written for Jest keep using the `jest` global
 * (`jest.fn()`, `jest.spyOn()`, …) on Vitest.
 */
import { vi } from 'vite-plus/test';

globalThis.jest = vi;
