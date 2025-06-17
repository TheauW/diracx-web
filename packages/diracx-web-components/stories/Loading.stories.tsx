import type { Meta, StoryObj } from "@storybook/react";

import { Loading } from "../src/components/shared";

const meta = {
  title: "Shared/Loading",
  component: Loading,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
