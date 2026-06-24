import { jest } from "@jest/globals";

const notificationServiceMock = {
  getNotificationsPaginated: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
};

await jest.unstable_mockModule("../../../src/services/notification.service.js", () => notificationServiceMock);
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = await import("../../../src/controllers/notification.controller.js");

const createRes = () => {
  const res = {};
  res.json = jest.fn(() => res);
  return res;
};

describe("notification.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getNotifications returns paginated payload", async () => {
    const req = { user: { _id: "u1" }, query: { page: "2", limit: "5" } };
    const res = createRes();
    const next = jest.fn();
    const notifications = [{ _id: "n1" }, { _id: "n2" }];
    const pagination = { page: 2, limit: 5, total: 12, totalPages: 3 };

    notificationServiceMock.getNotificationsPaginated.mockResolvedValue({
      notifications,
      pagination,
    });

    await getNotifications(req, res, next);

    expect(notificationServiceMock.getNotificationsPaginated).toHaveBeenCalledWith("u1", {
      page: "2",
      limit: "5",
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 2,
        notifications,
        pagination,
      }),
    );
  });

  test("markAsRead updates one notification", async () => {
    const req = { params: { id: "n1" }, user: { _id: "u1" } };
    const res = createRes();
    const next = jest.fn();
    const notification = { _id: "n1", isRead: true };
    notificationServiceMock.markAsRead.mockResolvedValue(notification);

    await markAsRead(req, res, next);

    expect(notificationServiceMock.markAsRead).toHaveBeenCalledWith("n1", "u1");
    expect(res.json).toHaveBeenCalledWith({
      message: "Notification marked as read",
      notification,
    });
  });

  test("markAllAsRead marks all user notifications", async () => {
    const req = { user: { _id: "u1" } };
    const res = createRes();
    const next = jest.fn();

    notificationServiceMock.markAllAsRead.mockResolvedValue({ acknowledged: true });
    await markAllAsRead(req, res, next);

    expect(notificationServiceMock.markAllAsRead).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith({ message: "All notifications marked as read" });
  });

  test("deleteNotification deletes notification by id and user", async () => {
    const req = { params: { id: "n1" }, user: { _id: "u1" } };
    const res = createRes();
    const next = jest.fn();

    notificationServiceMock.deleteNotification.mockResolvedValue({ _id: "n1" });
    await deleteNotification(req, res, next);

    expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith("n1", "u1");
    expect(res.json).toHaveBeenCalledWith({ message: "Notification deleted successfully" });
  });
});

