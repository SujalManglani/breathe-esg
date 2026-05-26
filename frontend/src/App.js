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

  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/records/"
      );

      setRecords(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/summary/"
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
    formData.append("company_id", 1);

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/upload/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
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
        `http://127.0.0.1:8000/api/record/${recordId}/status/`,
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
      if (filterType === "ALL")
        return true;

      if (
        filterType ===
        "SUSPICIOUS"
      ) {
        return record.suspicious;
      }

      return (
        record.status ===
        filterType
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
          color: "white",
          font: {
            weight: "400"
          }
        }
      }
    },

    scales: {
      x: {
        ticks: {
          color: "white",
          font: {
            weight: "400"
          }
        },

        grid: {
          color:
            "rgba(255,255,255,0.08)"
        }
      },

      y: {
        ticks: {
          color: "white",
          font: {
            weight: "400"
          }
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
        text-white
        p-6 md:p-10
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-blue-950
      "
    >
      {/* Header */}

      <div className="mb-12">
        <h1
          className="
            text-5xl
            md:text-6xl
            font-semibold
            tracking-tight
            bg-gradient-to-r
            from-white
            to-blue-400
            bg-clip-text
            text-transparent
          "
        >
          Breathe ESG
        </h1>

        <p className="text-slate-400 mt-3 text-lg">
          Smart ESG Emissions Dashboard
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <Card
          title="Total"
          value={
            summary.total_records ||
            0
          }
        />

        <Card
          title="Suspicious"
          value={
            summary.suspicious || 0
          }
        />

        <Card
          title="Approved"
          value={
            summary.approved || 0
          }
        />

        <Card
          title="Pending"
          value={
            summary.pending || 0
          }
        />
      </div>

      {/* Upload + Analytics */}

      <div className="grid lg:grid-cols-2 gap-8 mb-10">

        {/* Upload */}

        <div
          className="
            backdrop-blur-xl
            bg-white/10
            border border-white/10
            p-8
            rounded-3xl
            shadow-2xl
          "
        >
          <h2 className="text-2xl font-semibold mb-6">
            Upload CSV
          </h2>

          <input
            type="file"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
            className="
              w-full
              mb-5
              bg-slate-900/60
              border border-slate-700
              p-4
              rounded-xl
              text-sm
            "
          />

          <select
            value={sourceType}
            onChange={(e) =>
              setSourceType(
                e.target.value
              )
            }
            className="
              w-full
              p-4
              rounded-xl
              bg-slate-900/70
              border border-slate-700
              outline-none
              focus:ring-2
              focus:ring-blue-500
              text-sm
            "
          >
            <option value="SAP">
              SAP
            </option>

            <option value="UTILITY">
              UTILITY
            </option>

            <option value="TRAVEL">
              TRAVEL
            </option>
          </select>

          <button
            onClick={handleUpload}
            className="
              mt-6
              w-full
              bg-blue-600
              hover:bg-blue-500
              transition-all
              duration-300
              p-4
              rounded-2xl
              font-medium
              shadow-lg
              hover:scale-[1.02]
            "
          >
            Upload CSV
          </button>
        </div>

        {/* Analytics */}

        <div
          className="
            backdrop-blur-xl
            bg-white/10
            border border-white/10
            p-8
            rounded-3xl
            shadow-2xl
          "
        >
          <h2 className="text-2xl font-semibold mb-6">
            Analytics
          </h2>

          <Bar
            data={chartData}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Filters */}

      <div className="mb-8">
        <div
          className="
            backdrop-blur-xl
            bg-white/10
            border border-white/10
            rounded-3xl
            p-5
            shadow-2xl
            w-full
            md:w-96
          "
        >
          <label className="block text-slate-300 mb-3 text-sm font-medium">
            Filter Records
          </label>

          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(
                e.target.value
              )
            }
            className="
              w-full
              bg-slate-900/70
              border border-slate-700
              text-white
              p-4
              rounded-2xl
              outline-none
              focus:ring-2
              focus:ring-blue-500
              transition-all
              text-sm
            "
          >
            <option value="ALL">
              Show All
            </option>

            <option value="SUSPICIOUS">
              Suspicious Only
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

            <option value="LOCKED">
              Locked
            </option>

            <option value="PENDING">
              Pending
            </option>
          </select>
        </div>
      </div>

      {/* Table */}

      <div
        className="
          backdrop-blur-xl
          bg-white/10
          border border-white/10
          p-6
          rounded-3xl
          overflow-x-auto
          shadow-2xl
        "
      >
        <h2 className="text-2xl font-semibold mb-8">
          Emission Records
        </h2>

        <table className="w-full">
          <thead>
            <tr
              className="
                text-left
                border-b
                border-slate-700
                text-slate-300
                text-sm
                font-medium
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
                    duration-200
                  "
                >
                  <td className="p-4 text-sm">
                    {record.id}
                  </td>

                  <td className="p-4 text-sm">
                    {
                      record.activity_type
                    }
                  </td>

                  <td className="p-4 text-sm">
                    {record.scope}
                  </td>

                  <td className="p-4 text-sm">
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
                      <span
                        className="
                          text-red-400
                          text-sm
                          font-medium
                        "
                      >
                        ⚠ Suspicious
                      </span>
                    ) : (
                      <span
                        className="
                          text-green-400
                          text-sm
                          font-medium
                        "
                      >
                        ✓ Normal
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">

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
                          transition-all
                          duration-300
                          px-4
                          py-2
                          rounded-xl
                          text-sm
                          font-medium
                          shadow-lg
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
                          transition-all
                          duration-300
                          px-4
                          py-2
                          rounded-xl
                          text-sm
                          font-medium
                          shadow-lg
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
                          transition-all
                          duration-300
                          px-4
                          py-2
                          rounded-xl
                          text-sm
                          font-medium
                          shadow-lg
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
  );
}

function Card({
  title,
  value
}) {
  return (
    <div
      className="
        backdrop-blur-xl
        bg-white/10
        border border-white/10
        p-6
        rounded-3xl
        shadow-2xl
        hover:scale-105
        transition-all
        duration-300
      "
    >
      <h3 className="text-slate-300 text-base font-medium">
        {title}
      </h3>

      <h1 className="text-5xl font-semibold mt-3 tracking-tight">
        {value}
      </h1>
    </div>
  );
}

export default App;