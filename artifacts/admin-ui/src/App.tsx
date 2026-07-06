import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import ArticlesDashboard from "./pages/ArticlesDashboard";
import Editor from "./pages/Editor";
import AdminLayout from "./layouts/AdminLayout";
import IntelligenceAssets from "./pages/IntelligenceAssets";
import IntelligenceCandidates from "./pages/IntelligenceCandidates";
import IntelligencePreview from "./pages/IntelligencePreview";
import IntelligenceAssetDetail from "./pages/IntelligenceAssetDetail";
import IntelligenceDatasets from "./pages/IntelligenceDatasets";
import IntelligenceGraphPackages from "./pages/IntelligenceGraphPackages";
import ArticleWorkbench from "./pages/ArticleWorkbench";
import PublicationQueue from "./pages/PublicationQueue";
import CmsPackageIntake from "./pages/CmsPackageIntake";
import HygieneCenter from "./pages/HygieneCenter";
import IntelligenceWarehouse from "./pages/IntelligenceWarehouse";
import DependencyExplorer from "./pages/DependencyExplorer";

export default function App({ auth }: any) {
  const status =
    auth === undefined
      ? "loading"
      : auth?.authenticated
        ? "authenticated"
        : "unauthenticated";

  if (status === "loading") {
    return <div style={{ padding: 20 }}>Loading session...</div>;
  }

  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route
          path="/"
          element={
            status === "authenticated"
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={
            status === "authenticated"
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        <Route
          path="/dashboard"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <ArticlesDashboard />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/editor"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <Editor />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />


        <Route
          path="/intelligence"
          element={
            status === "authenticated"
              ? <Navigate to="/intelligence-candidates" replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/intelligence-assets"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <IntelligenceAssets />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />


        <Route
          path="/intelligence-candidates"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <IntelligenceCandidates />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/intelligence-assets/:assetId"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <IntelligenceAssetDetail />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/editor/:id"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <Editor />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

<Route
  path="/intelligence-preview/:candidateId"
  element={
    status === "authenticated"
      ? (
        <AdminLayout>
          <IntelligencePreview />
        </AdminLayout>
      )
      : <Navigate to="/login" replace />
  }
/>

        <Route
          path="/intelligence-datasets"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <IntelligenceDatasets />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />
        
        <Route
         path="/intelligence-warehouse"
         element={
           status === "authenticated"
             ? (
               <AdminLayout>
                 <IntelligenceWarehouse />
               </AdminLayout>
             )
             : <Navigate to="/login" replace />
         }
        />

        <Route
          path="/dependency-explorer"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <DependencyExplorer />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />
        
        <Route
          path="/intelligence-graph-packages"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <IntelligenceGraphPackages />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

       <Route
          path="/article-workbench"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <ArticleWorkbench />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/publication-queue"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <PublicationQueue />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/cms-package-intake"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <CmsPackageIntake />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={status === "authenticated" ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        <Route
          path="/hygiene-center"
          element={
            status === "authenticated"
              ? (
                <AdminLayout>
                  <HygieneCenter />
                </AdminLayout>
              )
              : <Navigate to="/login" replace />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
