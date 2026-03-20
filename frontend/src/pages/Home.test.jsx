/**
 * TDD - RED phase
 * Tests for the speech-bubble echo feature on the Home page.
 * All tests here are expected to FAIL until the feature is built.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Home from "./Home";

// Mock fetch so tests don't hit the real server
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ text: "hello", x: 42 }),
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

// ── Input field ────────────────────────────────────────────────────────────────

test("renders a text input on the home page", () => {
  renderHome();
  expect(screen.getByRole("textbox")).toBeInTheDocument();
});

test("renders a submit button", () => {
  renderHome();
  expect(screen.getByRole("button", { name: /send|submit|echo/i })).toBeInTheDocument();
});

// ── Bubble creation ────────────────────────────────────────────────────────────

test("calls /api/echo with the typed text when submitted", async () => {
  const user = userEvent.setup();
  renderHome();

  await user.type(screen.getByRole("textbox"), "hello");
  await user.click(screen.getByRole("button", { name: /send|submit|echo/i }));

  expect(global.fetch).toHaveBeenCalledWith(
    "/api/echo",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
    })
  );
});

test("shows a speech bubble containing the echoed text after submit", async () => {
  const user = userEvent.setup();
  renderHome();

  await user.type(screen.getByRole("textbox"), "hello");
  await user.click(screen.getByRole("button", { name: /send|submit|echo/i }));

  await waitFor(() => {
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

test("speech bubble has the 'bubble' CSS class for animation", async () => {
  const user = userEvent.setup();
  renderHome();

  await user.type(screen.getByRole("textbox"), "hello");
  await user.click(screen.getByRole("button", { name: /send|submit|echo/i }));

  await waitFor(() => {
    const bubble = screen.getByText("hello").closest(".bubble");
    expect(bubble).toBeInTheDocument();
  });
});

// ── Bubble position ────────────────────────────────────────────────────────────

test("bubble is positioned using the x value returned by the API", async () => {
  const user = userEvent.setup();
  renderHome();

  await user.type(screen.getByRole("textbox"), "hello");
  await user.click(screen.getByRole("button", { name: /send|submit|echo/i }));

  await waitFor(() => {
    const bubble = screen.getByText("hello").closest(".bubble");
    // x=42 → left should be set to "42%"
    expect(bubble).toHaveStyle({ left: "42%" });
  });
});

// ── Input reset ────────────────────────────────────────────────────────────────

test("input is cleared after submit", async () => {
  const user = userEvent.setup();
  renderHome();

  const input = screen.getByRole("textbox");
  await user.type(input, "hello");
  await user.click(screen.getByRole("button", { name: /send|submit|echo/i }));

  await waitFor(() => {
    expect(input).toHaveValue("");
  });
});

// ── Multiple bubbles ───────────────────────────────────────────────────────────

test("submitting twice spawns two bubbles", async () => {
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "first", x: 10 }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "second", x: 80 }),
    });

  const user = userEvent.setup();
  renderHome();

  const input = screen.getByRole("textbox");
  const btn = screen.getByRole("button", { name: /send|submit|echo/i });

  await user.type(input, "first");
  await user.click(btn);

  await user.type(input, "second");
  await user.click(btn);

  await waitFor(() => {
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });
});
