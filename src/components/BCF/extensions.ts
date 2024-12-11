import { XMLParser } from "fast-xml-parser";
import { BCFTopics } from "./BCFTopics";

export const extensionsImporter = (
  manager: BCFTopics,
  extensionsXML: string
) => {
  if (extensionsXML.trim() === "") return;

  const xmlParser = new XMLParser({
    allowBooleanAttributes: true,
    attributeNamePrefix: "",
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseAttributeValue: true,
    removeNSPrefix: true,
    trimValues: true,
  });

  const extensions = xmlParser.parse(extensionsXML).Extensions;
  if (!extensions) return;

  const { Priorities, TopicStatuses, TopicTypes, Users, TopicLabels, Stages } =
    extensions;

  if (Priorities && Priorities.Priority) {
    const priorities = Array.isArray(Priorities.Priority)
      ? Priorities.Priority
      : [Priorities.Priority];
    for (const priority of priorities) {
      manager.config.priorities.add(priority);
    }
  }

  if (TopicStatuses && TopicStatuses.TopicStatus) {
    const statuses = Array.isArray(TopicStatuses.TopicStatus)
      ? TopicStatuses.TopicStatus
      : [TopicStatuses.TopicStatus];
    for (const status of statuses) {
      manager.config.statuses.add(status);
    }
  }

  if (TopicTypes && TopicTypes.TopicType) {
    const types = Array.isArray(TopicTypes.TopicType)
      ? TopicTypes.TopicType
      : [TopicTypes.TopicType];
    for (const type of types) {
      manager.config.types.add(type);
    }
  }

  if (Users && Users.User) {
    const users = Array.isArray(Users.User) ? Users.User : [Users.User];
    for (const user of users) {
      manager.config.users.add(user);
    }
  }

  if (TopicLabels && TopicLabels.TopicLabel) {
    const labels = Array.isArray(TopicLabels.TopicLabel)
      ? TopicLabels.TopicLabel
      : [TopicLabels.TopicLabel];
    for (const label of labels) {
      manager.config.labels.add(label);
    }
  }

  if (Stages && Stages.Stage) {
    const stages = Array.isArray(Stages.Stage) ? Stages.Stage : [Stages.Stage];
    for (const stage of stages) {
      manager.config.stages.add(stage);
    }
  }
};
