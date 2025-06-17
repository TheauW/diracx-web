import { render } from "@testing-library/react";
import { composeStories } from "@storybook/react";
import * as stories from "../stories/Loading.stories";
import "@testing-library/jest-dom";

// Compose the stories to get actual Storybook behavior (decorators, args, etc)
const { Default } = composeStories(stories);

describe("Loading", () => {
  it("renders the component", () => {
    const { getByTestId } = render(<Default />);
    expect(getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
