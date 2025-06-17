import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Paper } from "@mui/material";
import { action } from "@storybook/addon-actions";
import {
  SearchBar,
  SearchBarProps,
} from "../src/components/shared/SearchBar/SearchBar";
import { InternalFilter } from "../src/types";
import { Data } from "../src/components/shared/SearchBar/Types";
import { ThemeProvider } from "../src/contexts/ThemeProvider";

// Données d'exemple pour les suggestions
const sampleData: Data[] = [
  {
    JobID: "12345",
    Status: "Running",
    Owner: "alice",
    Priority: 10,
    Site: "CERN",
  },
  {
    JobID: "67890",
    Status: "Completed",
    Owner: "bob",
    Priority: 5,
    Site: "GridKa",
  },
  {
    JobID: "11111",
    Status: "Failed",
    Owner: "charlie",
    Priority: 7,
    Site: "IN2P3",
  },
];

// Exemples d'équations de tokens
const sampleFilters: InternalFilter[] = [
  {
    id: 0,
    operator: "eq",
    parameter: "JobID",
    value: "12345",
  },
  {
    id: 1,
    operator: "in",
    parameter: "Status",
    values: ["Running", "Completed"],
  },
];

const meta: Meta<SearchBarProps> = {
  title: "shared/SearchBar",
  component: SearchBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    filters: {
      description: "`array` of `InternalFilter`",
      table: {
        type: { summary: "InternalFilter[]" },
      },
    },
    setFilters: {
      description: "`function` to set the `filters`",
      table: {
        type: { summary: "function" },
      },
    },
    data: {
      description: "`array` of data to be used for suggestions",
      table: {
        type: { summary: "Data[]" },
      },
    },
    searchFunction: {
      description: "`function` to call when the search is performed (optional)",
      table: {
        type: { summary: "function" },
      },
    },
    clearFunction: {
      description: "`function` to call when the search is cleared (optional)",
      table: {
        type: { summary: "function" },
      },
    },
    allowKeyWordSearch: {
      control: { type: "boolean" },
      description: "`boolean` to allow keyword search or not",
      defaultValue: true,
    },
    exceptCategories: {
      description:
        "`array` of categories to exclude from the search suggestions",
      table: {
        type: { summary: "string[]" },
      },
      defaultValue: [],
    },
    additionalCategories: {
      description:
        "`array` of additional categories to include in the suggestions",
      table: {
        type: { summary: "string[]" },
      },
      defaultValue: [],
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Paper sx={{ p: 2, minWidth: 600 }}>
          <Story />
        </Paper>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<SearchBarProps>;

export const Default: Story = {
  args: {
    filters: [],
    data: sampleData,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return (
      <SearchBar filters={filters} setFilters={setFilters} data={sampleData} />
    );
  },
};

export const WithSampleData: Story = {
  args: {
    filters: [],
    setFilters: action("setFilters"),
    data: sampleData,
    searchFunction: action("searchTriggered"),
    allowKeyWordSearch: true,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return <SearchBar {...args} filters={filters} setFilters={setFilters} />;
  },
};

export const WithPrefilledTokens: Story = {
  args: {
    filters: sampleFilters,
    setFilters: action("setFilters"),
    data: sampleData,
    searchFunction: action("searchTriggered"),
    allowKeyWordSearch: true,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return (
      <SearchBar
        {...args}
        // data={args.data}
        filters={filters}
        setFilters={setFilters}
      />
    );
  },
};

export const NoKeywordSearch: Story = {
  args: {
    filters: [],
    setFilters: action("setFilters"),
    data: sampleData,
    searchFunction: action("searchTriggered"),
    allowKeyWordSearch: false,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return <SearchBar {...args} filters={filters} setFilters={setFilters} />;
  },
};

export const EmptyData: Story = {
  args: {
    filters: [],
    setFilters: action("setFilters"),
    data: [],
    searchFunction: action("searchTriggered"),
    allowKeyWordSearch: true,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return <SearchBar {...args} filters={filters} setFilters={setFilters} />;
  },
};

export const AdditionalCategories: Story = {
  args: {
    filters: [],
    setFilters: action("setFilters"),
    data: sampleData,
    searchFunction: action("searchTriggered"),
    allowKeyWordSearch: true,
  },
  render: (args) => {
    const [filters, setFilters] = useState<InternalFilter[]>(args.filters);

    return (
      <SearchBar
        {...args}
        filters={filters}
        setFilters={setFilters}
        additionalCategories={{
          items: ["Custom Category 1 (string)", "Custom Category 2 (number)"],
          type: ["category_string", "category_number"],
        }}
      />
    );
  },
};
