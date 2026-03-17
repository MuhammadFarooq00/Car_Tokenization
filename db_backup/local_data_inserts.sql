--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public._prisma_migrations DISABLE TRIGGER ALL;

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('78942658-1b18-4261-9780-6abe598e4c03', 'ef67c538f4665c3389fae7bcb7a11b03da9818c054042322305bb4c384d833a5', '2026-02-18 17:07:52.552464+05', '20260216091336_init', NULL, NULL, '2026-02-18 17:07:52.442838+05', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('aa77a2eb-8bd4-4771-be03-da961658e76f', '172dbf1315bdd9989d894846ddfbc00d67eec4a71b678b9a3c890a03afe53f72', '2026-02-18 17:07:52.588326+05', '20260218152537_add_listings_and_holdings', NULL, NULL, '2026-02-18 17:07:52.553041+05', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b6666b1a-3467-4536-ab9c-feaa595e204a', '82aa93c027354288e6dece77f434b2d293096956f8efc9f7702b30d1cb4dc7c9', '2026-02-18 17:10:46.736736+05', '20260218121046_add_notifications_table', NULL, NULL, '2026-02-18 17:10:46.640892+05', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9deae85f-b955-4ba6-afc4-f891e14f03fc', 'ee9686a4f4974ac436ab598584291433f64c0ae32b1ea137be1646abefc1c3a8', '2026-02-19 11:21:19.131498+05', '20260219062118_add_user_wallets', NULL, NULL, '2026-02-19 11:21:18.956025+05', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5d8e6500-b12d-478f-b8d9-8181b5ce8e75', '940bdd0329c933c8e64075f4220f13669b8899db6b36b1a61caa3f308e674090', '2026-02-20 12:50:44.232146+05', '20260220075044_add_car_sale_tracking', NULL, NULL, '2026-02-20 12:50:44.200276+05', 1);


ALTER TABLE public._prisma_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: blockchain_sync_state; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.blockchain_sync_state DISABLE TRIGGER ALL;



ALTER TABLE public.blockchain_sync_state ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users (id, email, "passwordHash", name, avatar, "walletAddress", roles, "activeRole", "kycVerified", "createdAt", "updatedAt", "emailVerificationExpiry", "emailVerificationToken", "emailVerified", "passwordResetExpiry", "passwordResetToken", "onboardingCompleted", "pendingRoles") VALUES ('cb19ba8c-18d4-49c1-b790-92d4f25a2735', 'admin@demo.com', '$2b$12$PBIrW1P8GtGEs2HZor1ihe1dLaWl9z7ZfkC2mmMJveOXlR/dhq8/e', 'Platform Admin', NULL, NULL, '{admin}', 'admin', true, '2026-02-24 10:39:35.253', '2026-02-24 15:30:11.485', NULL, NULL, true, NULL, NULL, true, '{}');
INSERT INTO public.users (id, email, "passwordHash", name, avatar, "walletAddress", roles, "activeRole", "kycVerified", "createdAt", "updatedAt", "emailVerificationExpiry", "emailVerificationToken", "emailVerified", "passwordResetExpiry", "passwordResetToken", "onboardingCompleted", "pendingRoles") VALUES ('cmm06gaoh000054cq218p1b5b', 'muhammadfarooq9222@gmail.com', '$2b$12$8KxaLH.OPFZLOrJLVygwm.JTiVYaM4E90.oQTUqnHmOAFrYyPoEg.', 'Muhammad Farooq', NULL, '0x077ff866257da5fd7483842739593c0c37f3a118', '{investor,car_owner}', 'car_owner', false, '2026-02-24 05:40:59.537', '2026-02-24 10:34:30.077', NULL, NULL, true, NULL, NULL, true, '{}');
INSERT INTO public.users (id, email, "passwordHash", name, avatar, "walletAddress", roles, "activeRole", "kycVerified", "createdAt", "updatedAt", "emailVerificationExpiry", "emailVerificationToken", "emailVerified", "passwordResetExpiry", "passwordResetToken", "onboardingCompleted", "pendingRoles") VALUES ('cmm0825540000r4cqnkh5oph7', 'farooqsahib27@gmail.com', '$2b$12$H5mhiOtE3/W0dth5vomYnOmHRcluDZ4lOK6wvBtUgpUZgVTM0RWJC', 'Muhammad Farooq', NULL, '0xfff66dab867b28f76e817f03926b7d6c1fedae96', '{driver,investor,car_owner}', 'driver', false, '2026-02-24 06:25:58.408', '2026-02-24 10:37:55.379', NULL, NULL, true, NULL, NULL, true, '{}');
INSERT INTO public.users (id, email, "passwordHash", name, avatar, "walletAddress", roles, "activeRole", "kycVerified", "createdAt", "updatedAt", "emailVerificationExpiry", "emailVerificationToken", "emailVerified", "passwordResetExpiry", "passwordResetToken", "onboardingCompleted", "pendingRoles") VALUES ('cmm07f27h0000vscq7e2m2f44', 'farooqtariq400@gmail.com', '$2b$12$XErsLwyX9I.3DCW1ei6L5OrOTvgNNW59MkSGOUouTSbwVwo8NcC5C', 'Muhammad Farooq', NULL, '0xc8a41174ec57343bfbadada0b30901566676220a', '{investor,car_owner,driver}', 'car_owner', false, '2026-02-24 06:08:01.517', '2026-02-25 05:26:33.547', '2026-02-25 06:08:01.505', '7d9a000e-0872-4a2b-99fa-8bba2cc4e620', true, NULL, NULL, true, '{}');


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.cars DISABLE TRIGGER ALL;

INSERT INTO public.cars (id, "ownerId", name, make, model, year, vin, "totalShares", "pricePerShare", "metadataCID", status, "createdAt", "primarySaleActive", "publicSupply", "remainingPublicSupply", "sharesSold") VALUES (1, 'cmm0825540000r4cqnkh5oph7', 'Faroza KICKO', 'VYHUG678870', 'VBNHJ784', 2026, 'VIN3467489678790', 80, '10000000000000000', 'QmRhLSLDz7UScJqaqQyiwfqvxSiNneunU98TSxhngfD5Xh', 'active', '2026-02-24 10:32:42.314', false, 70, 0, 50);
INSERT INTO public.cars (id, "ownerId", name, make, model, year, vin, "totalShares", "pricePerShare", "metadataCID", status, "createdAt", "primarySaleActive", "publicSupply", "remainingPublicSupply", "sharesSold") VALUES (2, 'cmm0825540000r4cqnkh5oph7', 'Vembola BR2', 'BR23567897895421', 'BR23567897895421', 2026, 'BR23567897895421', 80, '10000000000000000', 'QmbKhKP5pfhaJTvvicqBSynHkLYDAQ3cqRJykJ83QpgT1g', 'active', '2026-02-25 07:13:16.022', false, 56, 0, 56);
INSERT INTO public.cars (id, "ownerId", name, make, model, year, vin, "totalShares", "pricePerShare", "metadataCID", status, "createdAt", "primarySaleActive", "publicSupply", "remainingPublicSupply", "sharesSold") VALUES (3, 'cmm06gaoh000054cq218p1b5b', 'Civic Matrolla G6', 'Civic Matrolla G6', 'Civic Matrolla G6', 2026, 'G3574678599659', 80, '1000000000000000', 'QmdPKuKGKwESAmCqHwxnWveHVs4wAqork5SmEyEyZr4qRJ', 'active', '2026-02-25 08:36:07.431', false, 56, 0, 56);


ALTER TABLE public.cars ENABLE TRIGGER ALL;

--
-- Data for Name: dividends; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.dividends DISABLE TRIGGER ALL;

INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1nl1vo0000egcqjebk2a7i', 'cmm06gaoh000054cq218p1b5b', 1, '363636363636363636', '0xd331790e5fc0af8fd3e9af8fe7dec5bf8068ad048c91aec67188adb5894494fc-cmm06gaoh000054cq218p1b5b', 'completed', '2026-02-25 06:28:21.06', '2026-02-25 06:28:20.654');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1nl1wc0001egcqew32gtbc', 'cmm0825540000r4cqnkh5oph7', 1, '436363636363636363', '0xd331790e5fc0af8fd3e9af8fe7dec5bf8068ad048c91aec67188adb5894494fc-cmm0825540000r4cqnkh5oph7', 'completed', '2026-02-25 06:28:21.084', '2026-02-25 06:28:20.654');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1qhx5v000n6ccq0vtvy81j', 'cmm06gaoh000054cq218p1b5b', 2, '250000000000000000', '0x1e90edcd03c8050c72dead1cb6c0a0e886788d0449727e640a1466f798468780-cmm06gaoh000054cq218p1b5b', 'completed', '2026-02-25 07:49:53.827', '2026-02-25 07:49:53.779');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1qhx65000o6ccqpdp4ly7n', 'cmm0825540000r4cqnkh5oph7', 2, '300000000000000000', '0x1e90edcd03c8050c72dead1cb6c0a0e886788d0449727e640a1466f798468780-cmm0825540000r4cqnkh5oph7', 'completed', '2026-02-25 07:49:53.837', '2026-02-25 07:49:53.779');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1sjywh000rs0cq23a6l7vc', 'cmm0825540000r4cqnkh5oph7', 3, '350000000000000000', '0x04f8bbce0d2345a55eda2ccbfbb934a4f70a2eedfa9ca367cb0c15deaaca6bae-cmm0825540000r4cqnkh5oph7', 'completed', '2026-02-25 08:47:28.625', '2026-02-25 08:47:28.388');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1sjyx7000ss0cqn8q4nr8r', 'cmm06gaoh000054cq218p1b5b', 3, '300000000000000000', '0x04f8bbce0d2345a55eda2ccbfbb934a4f70a2eedfa9ca367cb0c15deaaca6bae-cmm06gaoh000054cq218p1b5b', 'completed', '2026-02-25 08:47:28.651', '2026-02-25 08:47:28.388');
INSERT INTO public.dividends (id, "investorId", "carId", amount, "txHash", status, "createdAt", "paidAt") VALUES ('cmm1sjyxe000ts0cq9es1fe8r', 'cmm07f27h0000vscq7e2m2f44', 3, '150000000000000000', '0x04f8bbce0d2345a55eda2ccbfbb934a4f70a2eedfa9ca367cb0c15deaaca6bae-cmm07f27h0000vscq7e2m2f44', 'completed', '2026-02-25 08:47:28.658', '2026-02-25 08:47:28.388');


ALTER TABLE public.dividends ENABLE TRIGGER ALL;

--
-- Data for Name: driver_applications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.driver_applications DISABLE TRIGGER ALL;

INSERT INTO public.driver_applications (id, "userId", "carId", license, experience, documents, status, "reviewNote", "submittedAt", "reviewedAt") VALUES ('cmm1leptv00006kcq3cf4bqh4', 'cmm07f27h0000vscq7e2m2f44', 1, 's4546c8f9787g8', 3, '{"license": "/uploads/documents/88250fa9-4085-4c28-8b91-4598cbb8f638.png", "insurance": "/uploads/documents/8fa6bce9-24ab-4eae-871c-f04d1b19e50b.png", "background": "/uploads/documents/1ac4ba37-5eca-4a31-9de5-e88117e62a9a.png"}', 'approved', NULL, '2026-02-25 05:27:26.275', '2026-02-25 05:35:33.198');
INSERT INTO public.driver_applications (id, "userId", "carId", license, experience, documents, status, "reviewNote", "submittedAt", "reviewedAt") VALUES ('cmm1prt0y000a6ccq4mwjosoq', 'cmm07f27h0000vscq7e2m2f44', 2, 's4546c8f9787g8', 4, '{"license": "/uploads/documents/9fdeec69-b9f4-4e54-9a73-bfaff7f05866.png", "insurance": "/uploads/documents/931c09b1-cd18-4eac-8a27-5067548fea1a.png", "background": "/uploads/documents/81682e4e-0d69-4f39-8261-e61932aeb592.png"}', 'approved', NULL, '2026-02-25 07:29:35.41', '2026-02-25 07:30:08.955');
INSERT INTO public.driver_applications (id, "userId", "carId", license, experience, documents, status, "reviewNote", "submittedAt", "reviewedAt") VALUES ('cmm1sbtvi000cs0cqujkodpnj', 'cmm07f27h0000vscq7e2m2f44', 3, 's4546c8f9787g8', 2, '{"license": "/uploads/documents/6443c851-cd9a-4fc4-baa2-dcb0313b2e8f.png", "insurance": "/uploads/documents/cc91600f-ebcb-4a65-9952-9e3a712561c0.png", "background": "/uploads/documents/a4d6485c-ce8f-4103-8d51-54b0236cbd8a.png"}', 'approved', NULL, '2026-02-25 08:41:08.862', '2026-02-25 08:41:41.505');


ALTER TABLE public.driver_applications ENABLE TRIGGER ALL;

--
-- Data for Name: driver_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.driver_profiles DISABLE TRIGGER ALL;

INSERT INTO public.driver_profiles (id, "userId", license, experience, rating, "totalRides", approved, "assignedCarId") VALUES ('cmm1te16o00000gcqsojn29x3', 'cmm0825540000r4cqnkh5oph7', '', 0, 0, 0, true, NULL);
INSERT INTO public.driver_profiles (id, "userId", license, experience, rating, "totalRides", approved, "assignedCarId") VALUES ('cmm1lp5l10000twcq18ib0d7y', 'cmm07f27h0000vscq7e2m2f44', 's4546c8f9787g8', 3, 0, 3, true, 2);


ALTER TABLE public.driver_profiles ENABLE TRIGGER ALL;

--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.expenses DISABLE TRIGGER ALL;

INSERT INTO public.expenses (id, "carId", "submittedById", type, amount, description, receipt, status, "submittedAt", "approvedAt") VALUES ('cmm1m5y7c000atwcqsfkp5pf5', 1, 'cmm07f27h0000vscq7e2m2f44', 'fuel', '1200000000000000000', 'just about the fuel', '/uploads/receipts/3d333077-b00a-4011-8720-0b2d1dedf816.png', 'approved', '2026-02-25 05:48:36.84', '2026-02-25 05:49:10.894');


ALTER TABLE public.expenses ENABLE TRIGGER ALL;

--
-- Data for Name: kyc_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.kyc_verifications DISABLE TRIGGER ALL;



ALTER TABLE public.kyc_verifications ENABLE TRIGGER ALL;

--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.listings DISABLE TRIGGER ALL;

INSERT INTO public.listings (id, "sellerId", "carId", amount, "remainingAmount", "pricePerShare", status, "txHash", "blockNumber", "createdAt", "cancelledAt", "filledAt") VALUES (1, 'cmm06gaoh000054cq218p1b5b', 1, 25, 25, '10000000000000000', 'active', '0x7afb08410871a4a928cd0c476385f965d7c7a49f8bbd501a972edd5058c7fafa', 2303159, '2026-02-25 05:44:00', NULL, NULL);
INSERT INTO public.listings (id, "sellerId", "carId", amount, "remainingAmount", "pricePerShare", status, "txHash", "blockNumber", "createdAt", "cancelledAt", "filledAt") VALUES (2, 'cmm06gaoh000054cq218p1b5b', 2, 25, 0, '10000000000000000', 'filled', '0x1d4106ef34d29a1967fc5c4bff1e5007c18f4b3005e5611083f1a371e9de5d8d', 2303637, '2026-02-25 07:33:12', NULL, '2026-02-25 08:10:24');
INSERT INTO public.listings (id, "sellerId", "carId", amount, "remainingAmount", "pricePerShare", status, "txHash", "blockNumber", "createdAt", "cancelledAt", "filledAt") VALUES (3, 'cmm0825540000r4cqnkh5oph7', 3, 25, 10, '10000000000000000', 'active', '0x839b800bb56dce254e6d228cebaefc62e4949b274bc4e618e914c35fb3056f93', 2303933, '2026-02-25 08:39:36', NULL, NULL);


ALTER TABLE public.listings ENABLE TRIGGER ALL;

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.notifications DISABLE TRIGGER ALL;

INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm0gvgyk0002d8cqdi8v8rmm', 'cmm0825540000r4cqnkh5oph7', 'Car Registered On-Chain', '"Faroza KICKO" is now live on the blockchain! 70 shares are available for public sale.', 'success', true, '2026-02-24 10:32:43.676');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm0gysry0005d8cq1lszh9y9', 'cmm06gaoh000054cq218p1b5b', 'Shares Purchased', 'You successfully bought 50 shares of "Faroza KICKO" for 0.5125 ETH.', 'success', true, '2026-02-24 10:35:18.958');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm0gyss50006d8cqly48yb9f', 'cmm0825540000r4cqnkh5oph7', 'Shares Sold', '50 shares of "Faroza KICKO" were purchased. 20 shares remaining.', 'info', true, '2026-02-24 10:35:18.965');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm0h4p340008d8cqo4dgjezk', 'cmm0825540000r4cqnkh5oph7', 'Sale Closed — Car On Road', 'The public share sale for "Faroza KICKO" is now closed. 20 unsold shares were burned — total supply reduced by 20. The car is cleared for road operations.', 'success', true, '2026-02-24 10:39:54.112');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1lp5ln0001twcqij9akscn', 'cmm07f27h0000vscq7e2m2f44', 'Driver Application Approved', 'Your application to drive "Faroza KICKO" has been approved! You can now start driving.', 'success', true, '2026-02-25 05:35:33.275');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1lp5mp0002twcq725uaepn', 'cmm0825540000r4cqnkh5oph7', 'Driver Application Approved', 'You approved Muhammad Farooq''s application for "Faroza KICKO". They can now start driving.', 'success', true, '2026-02-25 05:35:33.313');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1lp5mx0003twcqdo436kk8', 'cmm0825540000r4cqnkh5oph7', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Faroza KICKO", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 05:35:33.321');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1lp5mx0004twcqgncsdtyx', 'cmm06gaoh000054cq218p1b5b', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Faroza KICKO", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 05:35:33.321');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1m06a10006twcqqnsitz2a', 'cmm06gaoh000054cq218p1b5b', 'Listing Created', 'Your listing for 25 shares of "Faroza KICKO" at 0.0100 ETH/share is now live on the marketplace.', 'success', true, '2026-02-25 05:44:07.369');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1m3i5l0008twcq90rqj2aa', 'cmm0825540000r4cqnkh5oph7', 'New Ride Logged', 'A new ride was logged for "Faroza KICKO": Model Town, Model Town Tehsil, PB, Pakistan → Lahore District, Shahdara Bagh, PB, Pakistan. Commission earned: 0.5000 ETH.', 'info', true, '2026-02-25 05:46:42.729');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1m3i5z0009twcq31lojs5w', 'cmm06gaoh000054cq218p1b5b', 'Ride Completed on Your Car', 'A ride was just completed on "Faroza KICKO" (Model Town, Model Town Tehsil, PB, Pakistan → Lahore District, Shahdara Bagh, PB, Pakistan). Your share of the commission is accruing.', 'success', true, '2026-02-25 05:46:42.743');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1m5yew000btwcqcpevokab', 'cmm0825540000r4cqnkh5oph7', 'New Expense Submitted', 'A fuel expense of 1.2000 ETH was submitted for "Faroza KICKO". Review and approve or reject.', 'warning', true, '2026-02-25 05:48:37.112');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1m6ohp000ctwcq9gl395x4', 'cmm07f27h0000vscq7e2m2f44', 'Expense Approved', 'Your expense for "Faroza KICKO" has been approved.', 'success', true, '2026-02-25 05:49:10.909');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1nl1wj0003egcqyvsw5xax', 'cmm0825540000r4cqnkh5oph7', 'Earnings Distributed', 'You received 0.4364 ETH from "Faroza KICKO". Check your wallet.', 'success', true, '2026-02-25 06:28:21.091');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1nl1wj0002egcqv6vh1yol', 'cmm06gaoh000054cq218p1b5b', 'Earnings Distributed', 'You received 0.3636 ETH from "Faroza KICKO". Check your wallet.', 'success', true, '2026-02-25 06:28:21.091');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1p6ufz00026ccqn85kfsz1', 'cmm0825540000r4cqnkh5oph7', 'Car Registered On-Chain', '"Vembola BR2" is now live on the blockchain! 56 shares are available for public sale.', 'success', true, '2026-02-25 07:13:17.471');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1p8em600056ccqh23f9gnn', 'cmm0825540000r4cqnkh5oph7', 'Shares Purchased', 'You successfully bought 6 shares of "Vembola BR2" for 0.0615 ETH.', 'success', true, '2026-02-25 07:14:30.27');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1p9yxc00096ccqj2l3j2m1', 'cmm0825540000r4cqnkh5oph7', 'Shares Sold', '50 shares of "Vembola BR2" were purchased. 0 shares remaining.', 'info', true, '2026-02-25 07:15:43.248');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1prt80000c6ccqjbdsdi22', 'cmm0825540000r4cqnkh5oph7', 'New Driver Application', 'Muhammad Farooq has applied to drive your car "Vembola BR2". Review the application in your dashboard.', 'info', true, '2026-02-25 07:29:35.664');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1psiyb000f6ccq4bspmwjw', 'cmm0825540000r4cqnkh5oph7', 'Driver Application Approved', 'You approved Muhammad Farooq''s application for "Vembola BR2". They can now start driving.', 'success', true, '2026-02-25 07:30:09.011');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1psiym000g6ccqj8a2hazi', 'cmm0825540000r4cqnkh5oph7', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Vembola BR2", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 07:30:09.022');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1prt7q000b6ccqfoo41mpl', 'cmm07f27h0000vscq7e2m2f44', 'Application Submitted', 'Your application to drive "Vembola BR2" has been submitted successfully. The car owner will review it shortly.', 'info', true, '2026-02-25 07:29:35.654');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1psixt000e6ccq783kao2g', 'cmm07f27h0000vscq7e2m2f44', 'Driver Application Approved', 'Your application to drive "Vembola BR2" has been approved! You can now start driving.', 'success', true, '2026-02-25 07:30:08.993');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1pug2k000j6ccq67cnuhkf', 'cmm0825540000r4cqnkh5oph7', 'New Ride Logged', 'A new ride was logged for "Vembola BR2": Model Town, Model Town Tehsil, PB, Pakistan → Shahdadpur, Railway Road, Shahdadpur 68030, Pakistan. Commission earned: 0.2000 ETH.', 'info', true, '2026-02-25 07:31:38.588');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1p9yx200086ccqzccmb6tw', 'cmm06gaoh000054cq218p1b5b', 'Shares Purchased', 'You successfully bought 50 shares of "Vembola BR2" for 0.5125 ETH.', 'success', true, '2026-02-25 07:15:43.238');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1psiyn000h6ccqe23weqyc', 'cmm06gaoh000054cq218p1b5b', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Vembola BR2", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 07:30:09.023');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1pug2y000k6ccqfw5mv4vb', 'cmm06gaoh000054cq218p1b5b', 'Ride Completed on Your Car', 'A ride was just completed on "Vembola BR2" (Model Town, Model Town Tehsil, PB, Pakistan → Shahdadpur, Railway Road, Shahdadpur 68030, Pakistan). Your share of the commission is accruing.', 'success', true, '2026-02-25 07:31:38.602');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1pwmis000m6ccqb4lspflp', 'cmm06gaoh000054cq218p1b5b', 'Listing Created', 'Your listing for 25 shares of "Vembola BR2" at 0.0100 ETH/share is now live on the marketplace.', 'success', true, '2026-02-25 07:33:20.26');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1qhx6m000q6ccqerxr2skx', 'cmm0825540000r4cqnkh5oph7', 'Earnings Distributed', 'You received 0.3000 ETH from "Vembola BR2". Check your wallet.', 'success', true, '2026-02-25 07:49:53.854');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1qhx6m000p6ccqqy09vrhn', 'cmm06gaoh000054cq218p1b5b', 'Earnings Distributed', 'You received 0.2500 ETH from "Vembola BR2". Check your wallet.', 'success', true, '2026-02-25 07:49:53.854');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1r8h0r00033gcq726e5snx', 'cmm06gaoh000054cq218p1b5b', 'Listing Filled', '25 shares of "Vembola BR2" from your listing were sold for 0.2562 ETH.', 'success', true, '2026-02-25 08:10:32.619');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1r8h0l00023gcqgutvovre', 'cmm07f27h0000vscq7e2m2f44', 'Shares Purchased', 'You bought 25 shares of "Vembola BR2" for 0.2562 ETH from the marketplace.', 'success', true, '2026-02-25 08:10:32.613');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1s5eut0002s0cqe9cohu70', 'cmm06gaoh000054cq218p1b5b', 'Car Registered On-Chain', '"Civic Matrolla G6" is now live on the blockchain! 56 shares are available for public sale.', 'success', true, '2026-02-25 08:36:09.461');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1s6cq50005s0cqneq20eut', 'cmm06gaoh000054cq218p1b5b', 'Shares Purchased', 'You successfully bought 6 shares of "Civic Matrolla G6" for 0.0062 ETH.', 'success', true, '2026-02-25 08:36:53.357');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1s7eue0008s0cq5wi91q59', 'cmm0825540000r4cqnkh5oph7', 'Shares Purchased', 'You successfully bought 50 shares of "Civic Matrolla G6" for 0.0512 ETH.', 'success', true, '2026-02-25 08:37:42.758');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1s7euw0009s0cq8huiwjt9', 'cmm06gaoh000054cq218p1b5b', 'Shares Sold', '50 shares of "Civic Matrolla G6" were purchased. 0 shares remaining.', 'info', true, '2026-02-25 08:37:42.776');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sa0rt000bs0cqpihnc6nl', 'cmm0825540000r4cqnkh5oph7', 'Listing Created', 'Your listing for 25 shares of "Civic Matrolla G6" at 0.0100 ETH/share is now live on the marketplace.', 'success', true, '2026-02-25 08:39:44.489');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sbtz0000ds0cqk1i7j7i5', 'cmm07f27h0000vscq7e2m2f44', 'Application Submitted', 'Your application to drive "Civic Matrolla G6" has been submitted successfully. The car owner will review it shortly.', 'info', true, '2026-02-25 08:41:08.988');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sbtzo000es0cqr30apwk0', 'cmm06gaoh000054cq218p1b5b', 'New Driver Application', 'Muhammad Farooq has applied to drive your car "Civic Matrolla G6". Review the application in your dashboard.', 'info', true, '2026-02-25 08:41:09.012');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1scj46000hs0cqivaobede', 'cmm06gaoh000054cq218p1b5b', 'Driver Application Approved', 'You approved Muhammad Farooq''s application for "Civic Matrolla G6". They can now start driving.', 'success', true, '2026-02-25 08:41:41.574');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1scj49000is0cqnr9fuxih', 'cmm06gaoh000054cq218p1b5b', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Civic Matrolla G6", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 08:41:41.577');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1scj2r000gs0cqt1g1b649', 'cmm07f27h0000vscq7e2m2f44', 'Driver Application Approved', 'Your application to drive "Civic Matrolla G6" has been approved! You can now start driving.', 'success', true, '2026-02-25 08:41:41.523');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1scj49000js0cq3u5zex3v', 'cmm0825540000r4cqnkh5oph7', 'Driver Assigned to Your Car', 'Muhammad Farooq has been assigned to "Civic Matrolla G6", a car you invested in. Operations may begin soon.', 'info', true, '2026-02-25 08:41:41.577');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sdrid000ms0cq27h6uk0c', 'cmm0825540000r4cqnkh5oph7', 'Ride Completed on Your Car', 'A ride was just completed on "Civic Matrolla G6" (Model Town, Model Town Tehsil, PB, Pakistan → Chandan Qila, KP, Pakistan). Your share of the commission is accruing.', 'success', true, '2026-02-25 08:42:39.108');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sdrhz000ls0cqp4qhi44e', 'cmm06gaoh000054cq218p1b5b', 'New Ride Logged', 'A new ride was logged for "Civic Matrolla G6": Model Town, Model Town Tehsil, PB, Pakistan → Chandan Qila, KP, Pakistan. Commission earned: 0.2000 ETH.', 'info', true, '2026-02-25 08:42:39.095');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sgg0x000qs0cqauljcygu', 'cmm0825540000r4cqnkh5oph7', 'Listing Filled', '15 shares of "Civic Matrolla G6" from your listing were sold for 0.1537 ETH.', 'success', true, '2026-02-25 08:44:44.193');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sgg07000ps0cqr2hpehoo', 'cmm07f27h0000vscq7e2m2f44', 'Shares Purchased', 'You bought 15 shares of "Civic Matrolla G6" for 0.1537 ETH from the marketplace.', 'success', true, '2026-02-25 08:44:44.167');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sjyy2000vs0cqubj9ogw7', 'cmm06gaoh000054cq218p1b5b', 'Earnings Distributed', 'You received 0.3000 ETH from "Civic Matrolla G6". Check your wallet.', 'success', true, '2026-02-25 08:47:28.682');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sjyy2000ws0cq9xr8qncs', 'cmm07f27h0000vscq7e2m2f44', 'Earnings Distributed', 'You received 0.1500 ETH from "Civic Matrolla G6". Check your wallet.', 'success', true, '2026-02-25 08:47:28.682');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1sjyy1000us0cqsr8wtgad', 'cmm0825540000r4cqnkh5oph7', 'Earnings Distributed', 'You received 0.3500 ETH from "Civic Matrolla G6". Check your wallet.', 'success', true, '2026-02-25 08:47:28.679');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1te17q00010gcqt0l4wa2l', 'cmm0825540000r4cqnkh5oph7', 'You Have Been Assigned as a Driver!', 'Congratulations! The car owner has assigned you to drive "Vembola BR2". You can now start logging rides for this vehicle.', 'success', true, '2026-02-25 09:10:51.302');
INSERT INTO public.notifications (id, "userId", title, message, type, read, "createdAt") VALUES ('cmm1tldu10001gscq2e7fra1v', 'cmm07f27h0000vscq7e2m2f44', 'You Have Been Assigned as a Driver!', 'Congratulations! The car owner has assigned you to drive "Vembola BR2". You can now start logging rides for this vehicle.', 'success', true, '2026-02-25 09:16:34.249');


ALTER TABLE public.notifications ENABLE TRIGGER ALL;

--
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.rides DISABLE TRIGGER ALL;

INSERT INTO public.rides (id, "carId", "driverId", pickup, dropoff, distance, duration, "grossEarnings", commission, "netEarnings", status, "timestamp") VALUES ('cmm1m3i500007twcq4mco6ow3', 1, 'cmm07f27h0000vscq7e2m2f44', 'Model Town, Model Town Tehsil, PB, Pakistan', 'Lahore District, Shahdara Bagh, PB, Pakistan', 17.9, 20, '2000000000000000000', '500000000000000000', '1500000000000000000', 'completed', '2026-02-25 05:46:42.708');
INSERT INTO public.rides (id, "carId", "driverId", pickup, dropoff, distance, duration, "grossEarnings", commission, "netEarnings", status, "timestamp") VALUES ('cmm1pug1q000i6ccqy76wmews', 2, 'cmm07f27h0000vscq7e2m2f44', 'Model Town, Model Town Tehsil, PB, Pakistan', 'Shahdadpur, Railway Road, Shahdadpur 68030, Pakistan', 991.7, 606, '800000000000000000', '200000000000000000', '600000000000000000', 'completed', '2026-02-25 07:31:38.558');
INSERT INTO public.rides (id, "carId", "driverId", pickup, dropoff, distance, duration, "grossEarnings", commission, "netEarnings", status, "timestamp") VALUES ('cmm1sdrha000ks0cqqvbeucxh', 3, 'cmm07f27h0000vscq7e2m2f44', 'Model Town, Model Town Tehsil, PB, Pakistan', 'Chandan Qila, KP, Pakistan', 530.8, 306, '800000000000000000', '200000000000000000', '600000000000000000', 'completed', '2026-02-25 08:42:39.07');


ALTER TABLE public.rides ENABLE TRIGGER ALL;

--
-- Data for Name: share_holdings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.share_holdings DISABLE TRIGGER ALL;

INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm0gvgxd0000d8cqhiok2fyw', 'cmm0825540000r4cqnkh5oph7', 1, 30, '2026-02-24 10:32:43.633');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm0gysrg0004d8cqwuy4922f', 'cmm06gaoh000054cq218p1b5b', 1, 25, '2026-02-25 05:44:07.362');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1p6udm00006ccq7lj9bb03', 'cmm0825540000r4cqnkh5oph7', 2, 30, '2026-02-25 07:14:30.25');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1p9ywl00076ccquatcclig', 'cmm06gaoh000054cq218p1b5b', 2, 25, '2026-02-25 07:33:20.252');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1r8gzw00013gcq35gbkpzp', 'cmm07f27h0000vscq7e2m2f44', 2, 25, '2026-02-25 08:10:32.588');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1s5ety0000s0cq87581nll', 'cmm06gaoh000054cq218p1b5b', 3, 30, '2026-02-25 08:36:53.339');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1s7etq0007s0cqfzu1xbhv', 'cmm0825540000r4cqnkh5oph7', 3, 25, '2026-02-25 08:39:44.485');
INSERT INTO public.share_holdings (id, "userId", "carId", shares, "lastUpdatedAt") VALUES ('cmm1sgg00000os0cqmjiaah5x', 'cmm07f27h0000vscq7e2m2f44', 3, 15, '2026-02-25 08:44:44.16');


ALTER TABLE public.share_holdings ENABLE TRIGGER ALL;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.transactions DISABLE TRIGGER ALL;

INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm0gvgy90001d8cqvfu75p10', 'cmm0825540000r4cqnkh5oph7', 'car_created', 1, 100, '10000000000000000', '0xd9d4fcef2444d3fbe26bc3625210263679c9d0a206f480406380d48264893cfa', 2297985, '2026-02-24 10:32:36');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm0gysqx0003d8cqngk4sb97', 'cmm06gaoh000054cq218p1b5b', 'primary_purchase', 1, 50, '512500000000000000', '0xac556e7ec4a002aa26ec9ceae447759818ff1b66f7c3fa3ee3d091592d0c93fb', 2297998, '2026-02-24 10:35:12');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm0h4p2j0007d8cqe5o2yma9', 'cmm0825540000r4cqnkh5oph7', 'car_created', 1, 20, '0', '0xdf85c4e95411a18f56dd182d176bb63d51688ae3a74ecce05dd24975cf4b82a0', 2298018, '2026-02-24 10:39:48');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1m067z0005twcqbe27990p', 'cmm06gaoh000054cq218p1b5b', 'listing_created', 1, 25, '10000000000000000', '0x7afb08410871a4a928cd0c476385f965d7c7a49f8bbd501a972edd5058c7fafa', 2303159, '2026-02-25 05:44:00');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1p6ufq00016ccqxcdf1t4m', 'cmm0825540000r4cqnkh5oph7', 'car_created', 2, 80, '10000000000000000', '0x36bc4cec4010ca4ed731f7b488f54f7ea02adf17c45be4c24af22cc590c13e57', 2303545, '2026-02-25 07:13:12');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1p8el700036ccqf03bk0qh', 'cmm0825540000r4cqnkh5oph7', 'primary_purchase', 2, 6, '61500000000000000', '0x81ebd91fa702fb49c185e7b352f7aff42c2a795efe41d219c0c794ebc3f70f04', 2303551, '2026-02-25 07:14:24');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1p9ywb00066ccqapf998fr', 'cmm06gaoh000054cq218p1b5b', 'primary_purchase', 2, 50, '512500000000000000', '0x70792b970bf096baad6afe0213b2dc6ad1d604aed83e49649a7061451b34fdad', 2303557, '2026-02-25 07:15:36');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1pwmgz000l6ccq65gudoit', 'cmm06gaoh000054cq218p1b5b', 'listing_created', 2, 25, '10000000000000000', '0x1d4106ef34d29a1967fc5c4bff1e5007c18f4b3005e5611083f1a371e9de5d8d', 2303637, '2026-02-25 07:33:12');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1r8gz500003gcqffn76ugg', 'cmm07f27h0000vscq7e2m2f44', 'listing_filled', 2, 25, '256250000000000000', '0xcb4a3c3ea7348e6b84144761c5a86aa9cc9c529269d6c976b995522a1ec00a88', 2303798, '2026-02-25 08:10:24');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1s5eul0001s0cqgz50ojsu', 'cmm06gaoh000054cq218p1b5b', 'car_created', 3, 80, '1000000000000000', '0xcabf1f56074cd09e90be39e218bd584bcb6d0691f2f447296f9981905d3a149e', 2303916, '2026-02-25 08:36:00');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1s6cpg0003s0cqrcwrom5n', 'cmm06gaoh000054cq218p1b5b', 'primary_purchase', 3, 6, '6150000000000000', '0x4bced0b1d5bfc9e982dccb2dcf9e54ad0ab7e6bcfbfa19a0a3a1fff09f7825f1', 2303919, '2026-02-25 08:36:48');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1s7eta0006s0cqhz5gwsqs', 'cmm0825540000r4cqnkh5oph7', 'primary_purchase', 3, 50, '51250000000000000', '0x75a9e14de7c86aac0f0da034da4610582e2cfa25b0c753b7615faae4d90eb2e0', 2303923, '2026-02-25 08:37:36');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1sa0qx000as0cqsmel3j3t', 'cmm0825540000r4cqnkh5oph7', 'listing_created', 3, 25, '10000000000000000', '0x839b800bb56dce254e6d228cebaefc62e4949b274bc4e618e914c35fb3056f93', 2303933, '2026-02-25 08:39:36');
INSERT INTO public.transactions (id, "userId", type, "carId", amount, price, "txHash", "blockNumber", "timestamp") VALUES ('cmm1sgfzi000ns0cqvlv15yel', 'cmm07f27h0000vscq7e2m2f44', 'listing_filled', 3, 15, '153750000000000000', '0x44fc0f220f5ace56289961ee117e8afa4adc932413af3b0ebaf91cf804ad36bb', 2303955, '2026-02-25 08:44:36');


ALTER TABLE public.transactions ENABLE TRIGGER ALL;

--
-- Data for Name: user_wallets; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_wallets DISABLE TRIGGER ALL;

INSERT INTO public.user_wallets (id, "userId", address, "isPrimary", label, "connectedAt") VALUES ('cmm06m1ck0000kkcq3dipglqo', 'cmm06gaoh000054cq218p1b5b', '0x077ff866257da5fd7483842739593c0c37f3a118', true, NULL, '2026-02-24 05:45:27.379');
INSERT INTO public.user_wallets (id, "userId", address, "isPrimary", label, "connectedAt") VALUES ('cmm07tmkx0000mkcq47tknur4', 'cmm07f27h0000vscq7e2m2f44', '0xc8a41174ec57343bfbadada0b30901566676220a', true, NULL, '2026-02-24 06:19:21.104');
INSERT INTO public.user_wallets (id, "userId", address, "isPrimary", label, "connectedAt") VALUES ('cmm082apc0001r4cqyh8te72x', 'cmm0825540000r4cqnkh5oph7', '0xfff66dab867b28f76e817f03926b7d6c1fedae96', true, NULL, '2026-02-24 06:26:05.616');


ALTER TABLE public.user_wallets ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

