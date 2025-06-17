import { render, screen, waitFor } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import userEvent from "@testing-library/user-event";
import * as stories from "../stories/SearchBar.stories";
import "@testing-library/jest-dom";

// Compose the stories to get actual Storybook behavior (decorators, args, etc)
const { Default, WithPrefilledTokens } = composeStories(stories);

describe("SearchBar", () => {
  it("renders the component", () => {
    render(<Default />);
    expect(screen.getByPlaceholderText("Enter a category")).toBeInTheDocument();
  });

  it("renders with preffiled tokens", () => {
    render(<WithPrefilledTokens />);
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Running | Completed")).toBeInTheDocument();
  });

  it("shows autocomplete suggestions when clicking in search field", async () => {
    const user = userEvent.setup();
    render(<Default />);

    const searchInput = screen.getByPlaceholderText("Enter a category");

    // Click in the search field
    await user.click(searchInput);

    // Type to trigger autocomplete
    await user.type(searchInput, "S");

    // Check if suggestions appear
    await waitFor(() => {
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    // Check if Site suggestion also appears
    expect(screen.getByText("Site")).toBeInTheDocument();
  });

  it("creates a token when selecting from autocomplete", async () => {
    const user = userEvent.setup();
    render(<Default />);

    const searchInput = screen.getByPlaceholderText("Enter a category");

    // Type and select a category
    await user.type(searchInput, "Status");
    await user.keyboard("{Enter}");

    // Check if token is created
    await waitFor(() => {
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    // Check if placeholder changes for operator
    expect(
      screen.getByPlaceholderText("Enter an operator"),
    ).toBeInTheDocument();
  });

  it("shows operator suggestions after selecting category", async () => {
    const user = userEvent.setup();
    render(<Default />);

    const searchInput = screen.getByPlaceholderText("Enter a category");

    // Create a category token
    await user.type(searchInput, "Status");
    await user.keyboard("{Enter}");

    // Type operator
    const operatorInput = screen.getByPlaceholderText("Enter an operator");
    await user.type(operatorInput, "=");

    // Check if operator suggestions appear
    await waitFor(() => {
      expect(screen.getByText("=")).toBeInTheDocument();
    });
  });

  it("shows token menu when clicking on existing token", async () => {
    const user = userEvent.setup();
    render(<WithPrefilledTokens />);

    // Find and click on an existing token
    const tokenButton = screen.getByText("12345");
    await user.click(tokenButton);

    // Check if menu appears (this might need adjustment based on actual implementation)
    await waitFor(
      () => {
        // Assuming the menu shows options for the token
        const menu = screen.getByRole("menu", { hidden: true });
        expect(menu).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("shows delete button when tokens exist", () => {
    render(<WithPrefilledTokens />);

    // Check if delete button is present
    const deleteButton = screen.getByTestId("DeleteIcon");
    expect(deleteButton).toBeInTheDocument();
  });

  it("removes all tokens when clicking delete button", async () => {
    const user = userEvent.setup();
    render(<WithPrefilledTokens />);

    // Verify tokens exist first
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Running | Completed")).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByTestId("DeleteIcon");
    await user.click(deleteButton);

    // Check if tokens are removed
    await waitFor(() => {
      expect(screen.queryByText("12345")).not.toBeInTheDocument();
      expect(screen.queryByText("Running | Completed")).not.toBeInTheDocument();
    });
  });

  it("focuses search field when clicking on search bar area", async () => {
    const user = userEvent.setup();
    render(<Default />);

    // Find the search bar container
    const searchBar = screen.getByTestId("search-bar");
    const searchInput = screen.getByPlaceholderText("Enter a category");

    // Click on the search bar area
    await user.click(searchBar);

    // Check if input is focused
    expect(searchInput).toHaveFocus();
  });
});
