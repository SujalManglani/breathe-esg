import { useEffect, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [records, setRecords] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [file, setFile] =
    useState(null);

  const [sourceType, setSourceType] =
    useState("SAP");

  const [filterType, setFilterType] =
    useState("ALL");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [themeGlow, setThemeGlow] =
    useState(true);

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, []);

  const API_BASE = "https://breathe-esg-w10o.onrender.com";

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/records/`
      );

      setRecords(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  const fetchSummary = async () => {
    try {
  const response = await axios.get(
  `${API_BASE}/api/summary/`
);

      setSummary(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "source_type",
      sourceType
    );

    formData.append(
      "company_id",
      1
    );

    try {
      await axios.post(
  `${API_BASE}/api/upload/`,
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
);

      alert("Upload successful");

      fetchRecords();
      fetchSummary();

    } catch (error) {
      console.log(error);
      alert("Upload failed");
    }
  };

  const updateStatus = async (
    recordId,
    newStatus
  ) => {
    try {
      await axios.post(
        `${API_BASE}/api/record/${recordId}/status/`,
        {
          status: newStatus,
          reviewer: "admin",
          notes: `${newStatus} via dashboard`
        }
      );

      fetchRecords();
      fetchSummary();

    } catch (error) {
      console.log(error);
      alert("Status update failed");
    }
  };

  const filteredRecords =
    records.filter((record) => {

      const matchesFilter =
        filterType === "ALL"
          ? true
          : filterType ===
            "SUSPICIOUS"
          ? record.suspicious
          : record.status ===
            filterType;

      const matchesSearch =
        record.activity_type
          ?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      return (
        matchesFilter &&
        matchesSearch
      );
    });

  const chartData = {
    labels: [
      "Approved",
      "Pending",
      "Rejected",
      "Locked",
      "Suspicious"
    ],

    datasets: [
      {
        label: "Records",

        data: [
          summary.approved || 0,
          summary.pending || 0,
          summary.rejected || 0,
          summary.locked || 0,
          summary.suspicious || 0
        ],

        backgroundColor: [
          "#22c55e",
          "#facc15",
          "#ef4444",
          "#64748b",
          "#dc2626"
        ],

        borderRadius: 12
      }
    ]
  };

  const chartOptions = {
    responsive: true,

    plugins: {
      legend: {
        labels: {
          color: "white"
        }
      }
    },

    scales: {
      x: {
        ticks: {
          color: "white"
        },

        grid: {
          color:
            "rgba(255,255,255,0.08)"
        }
      },

      y: {
        ticks: {
          color: "white"
        },

        grid: {
          color:
            "rgba(255,255,255,0.08)"
        }
      }
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        overflow-hidden
        relative
      "
    >

      {/* Animated Background */}

      {themeGlow && (
        <>
          <div
            className="
              absolute
              top-[-200px]
              left-[-150px]
              w-[700px]
              h-[700px]
              bg-blue-600/20
              blur-[180px]
              rounded-full
              animate-pulse
            "
          />

          <div
            className="
              absolute
              bottom-[-200px]
              right-[-150px]
              w-[700px]
              h-[700px]
              bg-purple-600/20
              blur-[180px]
              rounded-full
            "
          />
        </>
      )}

      {/* Main Content */}

      <div
        className="
          relative
          z-10
          p-4
          sm:p-6
          md:p-10
        "
      >

        {/* Header */}

        <div
          className="
            flex
            flex-col
            lg:flex-row
            justify-between
            items-start
            gap-6
            mb-14
          "
        >

          <div>

            <h1
              className="
                text-4xl
                sm:text-5xl
                md:text-7xl
                font-bold
                tracking-tight
                bg-gradient-to-r
                from-white
                via-blue-200
                to-slate-400
                bg-clip-text
                text-transparent
              "
            >
              Breathe ESG
            </h1>

            <p
              className="
                text-slate-400
                text-base
                sm:text-lg
                md:text-xl
                mt-4
              "
            >
              Modern ESG Emission Tracking & Management
            </p>

          </div>

          <button
            onClick={() =>
              setThemeGlow(!themeGlow)
            }
            className="
              px-5
              py-3
              rounded-2xl
              bg-white/10
              border
              border-white/10
              backdrop-blur-xl
              hover:bg-white/20
              transition-all
              duration-300
              w-full
              sm:w-auto
            "
          >
            Effects
          </button>

        </div>

        {/* KPI Cards */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-4
            gap-6
            mb-10
          "
        >

          <Card
            title="Total"
            value={
              summary.total_records || 0
            }
            glow="from-blue-500/20"
          />

          <Card
            title="Suspicious"
            value={
              summary.suspicious || 0
            }
            glow="from-red-500/20"
          />

          <Card
            title="Approved"
            value={
              summary.approved || 0
            }
            glow="from-green-500/20"
          />

          <Card
            title="Pending"
            value={
              summary.pending || 0
            }
            glow="from-yellow-500/20"
          />

        </div>

        {/* Upload + Analytics */}

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-3
            gap-8
            mb-10
          "
        >

          {/* Upload */}

          <div
            className="
              xl:col-span-1
              backdrop-blur-2xl
              bg-white/10
              border
              border-white/10
              rounded-[32px]
              p-6
              md:p-8
              shadow-2xl
              relative
              overflow-hidden
            "
          >

            <div
              className="
                absolute
                top-0
                right-0
                w-40
                h-40
                bg-blue-500/20
                blur-3xl
                rounded-full
              "
            />

            <h2
              className="
                text-2xl
                md:text-3xl
                font-semibold
                mb-8
              "
            >
              Upload Data
            </h2>

            <div
              className="
                border-2
                border-dashed
                border-slate-600
                rounded-3xl
                p-6
                md:p-10
                text-center
                bg-black/20
                hover:border-blue-500
                transition-all
                duration-300
              "
            >

              <div className="text-5xl mb-4">
                📂
              </div>

              <p className="text-slate-300 mb-6">
                Drop your ESG CSV file
              </p>

              <input
                type="file"
                onChange={(e) =>
                  setFile(
                    e.target.files[0]
                  )
                }
                className="w-full text-sm"
              />

            </div>

            <div className="relative mt-6">

              <select
                value={sourceType}
                onChange={(e) =>
                  setSourceType(
                    e.target.value
                  )
                }
                className="
                  w-full
                  appearance-none
                  bg-black/40
                  border
                  border-white/10
                  rounded-2xl
                  p-4
                  pr-12
                  outline-none
                  text-white
                "
              >

                <option
                  value="SAP"
                  className="bg-[#111]"
                >
                  SAP
                </option>

                <option
                  value="UTILITY"
                  className="bg-[#111]"
                >
                  UTILITY
                </option>

                <option
                  value="TRAVEL"
                  className="bg-[#111]"
                >
                  TRAVEL
                </option>

              </select>

              <div
                className="
                  absolute
                  right-5
                  top-1/2
                  -translate-y-1/2
                  pointer-events-none
                  text-slate-400
                  text-sm
                "
              >
                ▼
              </div>

            </div>

            <button
              onClick={handleUpload}
              className="
                mt-6
                w-full
                bg-gradient-to-r
                from-blue-600
                to-cyan-500
                p-4
                rounded-2xl
                font-semibold
                hover:scale-[1.02]
                transition-all
                shadow-2xl
              "
            >
              Upload CSV
            </button>

          </div>

          {/* Analytics */}

          <div
            className="
              xl:col-span-2
              backdrop-blur-2xl
              bg-white/10
              border
              border-white/10
              rounded-[32px]
              p-4
              md:p-6
              shadow-2xl
              overflow-hidden
            "
          >

            <div
              className="
                flex
                flex-col
                sm:flex-row
                justify-between
                items-start
                sm:items-center
                gap-4
                mb-6
              "
            >

              <h2
                className="
                  text-2xl
                  md:text-3xl
                  font-semibold
                "
              >
                Status Analytics
              </h2>

              <div
                className="
                  px-4
                  py-2
                  rounded-full
                  bg-green-500/20
                  text-green-400
                  text-sm
                "
              >
                Live
              </div>

            </div>

            <div className="w-full overflow-x-auto">
              <Bar
                data={chartData}
                options={chartOptions}
              />
            </div>

          </div>

        </div>

        {/* Search + Filter */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
            mb-8
          "
        >

          <input
            type="text"
            placeholder="Search activity type..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="
              bg-white/10
              border
              border-white/10
              backdrop-blur-xl
              rounded-2xl
              p-4
              outline-none
              text-white
              placeholder:text-slate-500
            "
          />

          <div className="relative w-full">

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value
                )
              }
              className="
                w-full
                appearance-none
                bg-white/10
                border
                border-white/10
                backdrop-blur-xl
                rounded-2xl
                p-4
                pr-12
                text-white
                outline-none
                focus:border-blue-500
                transition-all
                duration-300
                cursor-pointer
              "
            >

              <option
                value="ALL"
                className="bg-[#111]"
              >
                Show All
              </option>

              <option
                value="SUSPICIOUS"
                className="bg-[#111]"
              >
                Suspicious Only
              </option>

              <option
                value="APPROVED"
                className="bg-[#111]"
              >
                Approved
              </option>

              <option
                value="REJECTED"
                className="bg-[#111]"
              >
                Rejected
              </option>

              <option
                value="LOCKED"
                className="bg-[#111]"
              >
                Locked
              </option>

              <option
                value="PENDING"
                className="bg-[#111]"
              >
                Pending
              </option>

            </select>

            <div
              className="
                pointer-events-none
                absolute
                right-5
                top-1/2
                -translate-y-1/2
                text-slate-400
                text-sm
              "
            >
              ▼
            </div>

          </div>

        </div>

        {/* Table */}

        <div
          className="
            backdrop-blur-2xl
            bg-white/10
            border
            border-white/10
            rounded-[32px]
            p-4
            md:p-6
            overflow-hidden
            shadow-2xl
          "
        >

          <div
            className="
              flex
              flex-col
              sm:flex-row
              justify-between
              items-start
              sm:items-center
              gap-4
              mb-8
            "
          >

            <h2
              className="
                text-2xl
                md:text-3xl
                font-semibold
              "
            >
              Emission Records
            </h2>

            <div
              className="
                px-4
                py-2
                rounded-full
                bg-blue-500/20
                text-blue-400
                text-sm
              "
            >
              {filteredRecords.length} Records
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>

                <tr
                  className="
                    border-b
                    border-slate-700
                    text-slate-300
                    text-left
                  "
                >

                  <th className="p-4">
                    ID
                  </th>

                  <th className="p-4">
                    Activity
                  </th>

                  <th className="p-4">
                    Scope
                  </th>

                  <th className="p-4">
                    Quantity
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4">
                    Flag
                  </th>

                  <th className="p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.map(
                  (record) => (

                    <tr
                      key={record.id}
                      className="
                        border-b
                        border-slate-800
                        hover:bg-white/5
                        transition-all
                      "
                    >

                      <td className="p-4">
                        {record.id}
                      </td>

                      <td className="p-4">
                        {
                          record.activity_type
                        }
                      </td>

                      <td className="p-4">
                        {record.scope}
                      </td>

                      <td className="p-4">
                        {
                          record.normalized_quantity
                        }{" "}
                        {
                          record.normalized_unit
                        }
                      </td>

                      <td className="p-4">

                        <span
                          className={`
                            px-4
                            py-2
                            rounded-full
                            text-xs
                            font-medium

                            ${
                              record.status ===
                              "APPROVED"
                                ? "bg-green-500/20 text-green-400"
                                : ""
                            }

                            ${
                              record.status ===
                              "REJECTED"
                                ? "bg-red-500/20 text-red-400"
                                : ""
                            }

                            ${
                              record.status ===
                              "PENDING"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : ""
                            }

                            ${
                              record.status ===
                              "LOCKED"
                                ? "bg-slate-500/20 text-slate-300"
                                : ""
                            }
                          `}
                        >
                          {
                            record.status
                          }
                        </span>

                      </td>

                      <td className="p-4">

                        {record.suspicious ? (
                          <span className="text-red-400">
                            ⚠ Suspicious
                          </span>
                        ) : (
                          <span className="text-green-400">
                            ✓ Normal
                          </span>
                        )}

                      </td>

                      <td className="p-4">

                        <div
                          className="
                            flex
                            flex-wrap
                            gap-2
                          "
                        >

                          <button
                            onClick={() =>
                              updateStatus(
                                record.id,
                                "APPROVED"
                              )
                            }
                            className="
                              bg-green-500/80
                              hover:bg-green-500
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              transition-all
                            "
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                record.id,
                                "REJECTED"
                              )
                            }
                            className="
                              bg-red-500/80
                              hover:bg-red-500
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              transition-all
                            "
                          >
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                record.id,
                                "LOCKED"
                              )
                            }
                            className="
                              bg-slate-500/80
                              hover:bg-slate-500
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              transition-all
                            "
                          >
                            Lock
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

function Card({
  title,
  value,
  glow
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        backdrop-blur-xl
        bg-white/10
        border
        border-white/10
        p-6
        md:p-8
        rounded-[32px]
        shadow-2xl
        hover:scale-[1.03]
        transition-all
        duration-500
      `}
    >

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${glow}
          to-transparent
        `}
      />

      <div className="relative z-10">

        <h3
          className="
            text-slate-300
            text-base
            md:text-lg
          "
        >
          {title}
        </h3>

        <h1
          className="
            text-5xl
            md:text-6xl
            font-bold
            mt-4
          "
        >
          {value}
        </h1>

      </div>

    </div>
  );
}

export default App; 