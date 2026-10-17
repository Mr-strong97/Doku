import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto"; // IndexedDB simulée : Dexie fonctionne dans les tests
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup(); // retire les composants affichés par le test précédent
});
