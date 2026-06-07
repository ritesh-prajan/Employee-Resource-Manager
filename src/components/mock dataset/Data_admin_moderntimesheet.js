import moment from "moment";

export default function TimelineData() {
  const groups = [
    {
      id: "1",
      title: "Alex Rivera",
      initials: "AR",
      totalHours: 4.0,
      status: "Online",
    },
    {
      id: "2",
      title: "Vikram Mehta",
      initials: "VM",
      totalHours: 0,
      status: "Offline",
    },
    {
      id: "3",
      title: "Marcus Chen",
      initials: "MC",
      totalHours: 6.5,
      status: "Online",
    },
    {
      id: "4",
      title: "Elena Rostova",
      initials: "ER",
      totalHours: 0,
      status: "Offline",
    },
    {
      id: "5",
      title: "Liam O'Connor",
      initials: "LO",
      totalHours: 2.0,
      status: "Online",
    },
    {
      id: "6",
      title: "Sarah Johnson",
      initials: "SJ",
      totalHours: 5.0,
      status: "Online",
    },
    {
      id: "7",
      title: "Daniel Brown",
      initials: "DB",
      totalHours: 3.5,
      status: "Online",
    },
    {
      id: "8",
      title: "Emma Wilson",
      initials: "EW",
      totalHours: 7.0,
      status: "Online",
    },
    {
      id: "9",
      title: "Michael Lee",
      initials: "ML",
      totalHours: 4.5,
      status: "Online",
    },
    {
      id: "10",
      title: "Priya Sharma",
      initials: "PS",
      totalHours: 6.0,
      status: "Online",
    },
  ];

  const day = moment("2026-05-29");

  const items = [
    {
      id: "1",
      group: "1",
      title: "4.0h",
      start: day.clone().hour(10).minute(0).valueOf(),
      end: day.clone().hour(14).minute(0).valueOf(),
      className: "timeline-task",
    },

    {
      id: "2",
      group: "3",
      title: "4.5h",
      start: day.clone().hour(8).minute(30).valueOf(),
      end: day.clone().hour(13).minute(0).valueOf(),
      className: "timeline-task",
    },

    {
      id: "3",
      group: "3",
      title: "2.0h",
      start: day.clone().hour(14).minute(0).valueOf(),
      end: day.clone().hour(16).minute(0).valueOf(),
      className: "timeline-task",
    },

    {
      id: "4",
      group: "5",
      title: "2.0h",
      start: day.clone().hour(9).minute(30).valueOf(),
      end: day.clone().hour(11).minute(30).valueOf(),
      className: "timeline-task",
    },

    {
      id: "5",
      group: "6",
      title: "5.0h",
      start: day.clone().hour(11).minute(0).valueOf(),
      end: day.clone().hour(16).minute(0).valueOf(),
      className: "timeline-task",
    },

    {
      id: "6",
      group: "7",
      title: "3.5h",
      start: day.clone().hour(13).minute(0).valueOf(),
      end: day.clone().hour(16).minute(30).valueOf(),
      className: "timeline-task",
    },

    {
      id: "7",
      group: "8",
      title: "7.0h",
      start: day.clone().hour(8).minute(0).valueOf(),
      end: day.clone().hour(15).minute(0).valueOf(),
      className: "timeline-task",
    },

    {
      id: "8",
      group: "9",
      title: "4.5h",
      start: day.clone().hour(12).minute(0).valueOf(),
      end: day.clone().hour(16).minute(30).valueOf(),
      className: "timeline-task",
    },

    {
      id: "9",
      group: "10",
      title: "6.0h",
      start: day.clone().hour(9).minute(0).valueOf(),
      end: day.clone().hour(15).minute(0).valueOf(),
      className: "timeline-task",
    },
  ];

  return {
    groups,
    items,
  };
}