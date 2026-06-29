import { setAuthTokenGetter } from "@workspace/api-client-react";

/**
 * CMS is now session-based only.
 * Token auth is disabled for CMS layer.
 */
setAuthTokenGetter(() => {
  return null;
});
