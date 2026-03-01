import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/reference/openscroll-capture-api",
    },
    {
      type: "category",
      label: "Health",
      link: {
        type: "doc",
        id: "api/reference/health",
      },
      items: [
        {
          type: "doc",
          id: "api/reference/health-check",
          label: "Basic health check",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/health-check-detailed",
          label: "Detailed health check",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Capture",
      link: {
        type: "doc",
        id: "api/reference/capture",
      },
      items: [
        {
          type: "doc",
          id: "api/reference/capture-conversation",
          label: "Capture a conversation",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Conversations",
      link: {
        type: "doc",
        id: "api/reference/conversations",
      },
      items: [
        {
          type: "doc",
          id: "api/reference/list-conversations",
          label: "List conversations",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/get-conversation",
          label: "Get conversation by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/delete-conversation",
          label: "Delete conversation",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "api/reference/search-conversations",
          label: "Search conversations",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/get-conversation-stats",
          label: "Get conversation statistics",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/get-recent-conversations",
          label: "Get recent conversations",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Providers",
      link: {
        type: "doc",
        id: "api/reference/providers",
      },
      items: [
        {
          type: "doc",
          id: "api/reference/list-providers",
          label: "List supported providers",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/reference/detect-provider",
          label: "Detect provider from URL",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
