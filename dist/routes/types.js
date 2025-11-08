"use strict";
// export type UUID = string & { readonly brand: unique symbol };
// export type UserId = UUID;
// export interface UserProfile {
//   id: UserId;
//   firstname: string;
//   lastname: string;
//   email: string;
//   username: string;
//   phone: string;
//   gender: string;
//   birthday: string;
//   company: string;
//   linkedIn: string;
//   emergencyContactName: string;
//   emergencyContactPhone: string;
//   friends: UserProfile[];
//   friendRequests: {
//     requestId: UUID;
//     sender: FriendProfile;
//     recipient: FriendProfile;
//   };
// }
// export type Verified = { password: string; active: boolean };
// export type User = UserProfile & Verified;
// export type FriendProfile = {
//   id: UUID;
//   firstname: string;
//   lastname: string;
//   username: string;
//   email: string;
//   phone: string;
//   gender: string;
//   birthday: string;
//   company: string;
//   linkedIn: string;
// };
// export type FriendRequest = {
//   requestId: UUID;
//   sender: FriendProfile;
//   recipient: FriendProfile;
// };
// export type Group = {
//   id: string;
//   name: string;
//   createdById: UUID;
//   memberIds: UUID[];
// };
// export type FamilyMember = {
//   id: UUID;
//   firstname: string;
//   lastname: string;
// }
// export type CarpoolStatus = "Pending" | "Confirmed" | "In Progress" | "Completed";
// export type CarpoolId = UUID;
// export type DriverProfile = {
//   id: UserId;
//   firstname: string;
//   lastname: string;
// };
// export type Carpool = {
//   id: CarpoolId;
//   purpose: string;
//   from: string;
//   to: string;
//   date: string;
//   time: string;
//   returnTrip: boolean;
//   passengers: string[];
//   notes: string;
//   status: CarpoolStatus;
//   driver?: DriverProfile;
//   createdBy: FriendProfile;
// };
// export type Trip = {
//   id: UUID;
//   purpose: string;
//   from: string;
//   to: string;
//   passengers: string[];
//   notes: string;
// };
// export type GroupId = UUID;
