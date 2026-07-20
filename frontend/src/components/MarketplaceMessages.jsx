import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleUserRound,
  Ellipsis,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { assetUrl } from "../config/runtime.js";
import "../styles/client-space.css";

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-HT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversationAvatar({ image, name, large = false }) {
  return (
    <span className={large ? "conversation-avatar large" : "conversation-avatar"}>
      {image ? (
        <img src={assetUrl(image)} alt={name} />
      ) : (
        (name || "??").slice(0, 2).toUpperCase() || <CircleUserRound />
      )}
    </span>
  );
}

function normalizeSellerContact(contact) {
  const normalizedId = Number(contact?.id ?? contact?.seller_id ?? 0);
  if (!normalizedId) return null;
  return {
    id: normalizedId,
    seller_id: normalizedId,
    name: contact?.name || contact?.shop_name || "Boutique VinnHT",
    image_url: contact?.image_url || contact?.shop_logo_url || null,
    category: contact?.category || null,
  };
}

export default function MarketplaceMessages({
  api,
  user,
  sellerMode = false,
  onMobileConversationChange,
  onCounterChange,
  externalQuery,
  onExternalQueryChange,
  autoSelectFirst = true,
}) {
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];
  const userId = Number(user?.id || 0);
  const isClientUser = userRoles.includes("client");
  const isSellerUser = userRoles.includes("seller");
  const isSupportStaff = Array.isArray(user?.roles)
    ? user.roles.some((role) => ["support", "admin"].includes(role))
    : ["support", "admin"].includes(user?.role);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestedConversation = Number(queryParams.get("conversation")) || null;
  const preparedDraft = queryParams.get("draft") || "";
  const openSupport = queryParams.get("support") === "1";
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [supportError, setSupportError] = useState("");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(Boolean(requestedConversation || openSupport));
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [conversationActionsOpen, setConversationActionsOpen] = useState(false);
  const [activeMessageActionId, setActiveMessageActionId] = useState(null);
  const historyRef = React.useRef(null);
  const conversationActionsRef = React.useRef(null);
  const supportContext = sellerMode ? "support_seller" : "support_client";

  const isConversationAllowedInCurrentView = React.useCallback(
    (conversation) => {
      if (!conversation) return false;
      const context = conversation.support_context || "marketplace";

      if (isSupportStaff) return true;

      if (sellerMode) {
        if (!isSellerUser) return false;
        if (context === "support_seller") return true;
        if (context === "support_client") return false;
        return Number(conversation.seller_id) === userId;
      }

      if (!isClientUser) return false;
      if (context === "support_client") return true;
      if (context === "support_seller") return false;
      return Number(conversation.client_id) === userId;
    },
    [isClientUser, isSellerUser, isSupportStaff, sellerMode, userId],
  );

  const dedupeConversations = React.useCallback(
    (items = []) => {
      const seenSupportKeys = new Set();
      return items.filter((item) => {
        if (!["support_client", "support_seller"].includes(item.support_context)) {
          return true;
        }
        const key = isSupportStaff
          ? `${item.client_id}:${item.support_context}`
          : item.support_context;
        if (seenSupportKeys.has(key)) {
          return false;
        }
        seenSupportKeys.add(key);
        return true;
      });
    },
    [isSupportStaff],
  );

  const findExistingSupportConversation = React.useCallback(
    (items = []) =>
      items.find(
        (item) => item.support_context === supportContext,
      ) || null,
    [supportContext],
  );

  const loadContacts = React.useCallback(async () => {
    if (!isClientUser || sellerMode) {
      setContacts([]);
      return;
    }
    const [contactsResult, shopsResult] = await Promise.allSettled([
      api.get("/messages/contacts"),
      api.get("/shops"),
    ]);

    const rawContacts = [
      ...(contactsResult.status === "fulfilled" && Array.isArray(contactsResult.value.data)
        ? contactsResult.value.data
        : []),
      ...(shopsResult.status === "fulfilled" && Array.isArray(shopsResult.value.data)
        ? shopsResult.value.data
        : []),
    ];

    const mappedContacts = rawContacts
      .map(normalizeSellerContact)
      .filter(Boolean);

    const dedupedContacts = Array.from(
      mappedContacts.reduce((map, contact) => {
        if (!map.has(contact.id)) {
          map.set(contact.id, contact);
          return map;
        }
        const current = map.get(contact.id);
        map.set(contact.id, {
          ...current,
          ...contact,
          name: current.name || contact.name,
          image_url: current.image_url || contact.image_url,
          category: current.category || contact.category,
        });
        return map;
      }, new Map()).values(),
    ).sort((left, right) => left.name.localeCompare(right.name, "fr", { sensitivity: "base" }));

    setContacts(dedupedContacts);
  }, [api, isClientUser, sellerMode]);

  useEffect(() => {
    onMobileConversationChange?.(mobileConversationOpen);
  }, [mobileConversationOpen, onMobileConversationChange]);

  useEffect(() => {
    const unreadTotal = conversations.reduce(
      (total, item) => total + Number(item.unread_count || 0),
      0,
    );
    onCounterChange?.(unreadTotal);
  }, [conversations, onCounterChange]);

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-message-conversation-open",
      mobileConversationOpen,
    );
    return () => {
      document.body.classList.remove("mobile-message-conversation-open");
    };
  }, [mobileConversationOpen]);

  const loadConversations = React.useCallback(async (preferredConversation = null) => {
    const { data } = await api.get("/messages/conversations");
    const normalizedData = dedupeConversations(Array.isArray(data) ? data : [])
      .filter(isConversationAllowedInCurrentView);
    setConversations(normalizedData);
    setActive(
      (current) => {
        const candidate = preferredConversation || requestedConversation || current;
        if (candidate && normalizedData.some((item) => Number(item.id) === Number(candidate))) {
          return candidate;
        }
        if (autoSelectFirst) {
          return normalizedData[0]?.id || null;
        }
        return null;
      },
    );
    return normalizedData;
  }, [
    api,
    autoSelectFirst,
    dedupeConversations,
    isConversationAllowedInCurrentView,
    requestedConversation,
  ]);

  const loadMessages = React.useCallback(async (id) => {
    if (!id) return setMessages([]);
    const { data } = await api.get(`/messages/conversations/${id}`);
    setMessages(data);
    setConversations((items) =>
      items.map((item) =>
        Number(item.id) === Number(id) ? { ...item, unread_count: 0 } : item,
      ),
    );
    window.dispatchEvent(new CustomEvent("vinnht:notifications-refresh"));
  }, [api]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const loadedConversations = await loadConversations();
        if (openSupport) {
          const existingSupportConversation =
            findExistingSupportConversation(loadedConversations);
          if (existingSupportConversation) {
            setActive(existingSupportConversation.id);
          } else {
            const { data } = await api.post("/messages/support", {
              context: sellerMode ? "seller" : "client",
            });
            await loadConversations(data.id);
            setActive(data.id);
          }
          setMobileConversationOpen(true);
        }
      } catch (error) {
        setSupportError(
          error.response?.data?.message ||
            "Impossible d’ouvrir le support VinnHT.",
        );
      }
    };
    initialize();
    if (preparedDraft) setDraft(preparedDraft);
    loadContacts();
    const interval = window.setInterval(loadConversations, 10000);
    return () => window.clearInterval(interval);
  }, [
    findExistingSupportConversation,
    loadContacts,
    loadConversations,
    openSupport,
    preparedDraft,
    sellerMode,
  ]);

  useEffect(() => {
    loadMessages(active);
  }, [active]);

  useEffect(() => {
    const history = historyRef.current;
    if (!history) return;
    history.scrollTop = history.scrollHeight;
  }, [messages, active]);

  useEffect(() => {
    setConversationActionsOpen(false);
    setActiveMessageActionId(null);
  }, [active, mobileConversationOpen]);

  useEffect(() => {
    if (!conversationActionsOpen) return undefined;
    const handlePointerDown = (event) => {
      if (conversationActionsRef.current?.contains(event.target)) return;
      setConversationActionsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [conversationActionsOpen]);

  const startConversation = async (event) => {
    if (!event.target.value) return;
    const { data } = await api.post("/messages/conversations", {
      sellerId: event.target.value,
    });
    await loadConversations();
    setActive(data.id);
    setMobileConversationOpen(true);
    event.target.value = "";
  };

  const openSupportConversation = async () => {
    try {
      const existingSupportConversation =
        findExistingSupportConversation(conversations);
      if (existingSupportConversation) {
        await loadConversations(existingSupportConversation.id);
        setActive(existingSupportConversation.id);
        setMobileConversationOpen(true);
        setSupportError("");
        return;
      }
      const { data } = await api.post("/messages/support", {
        context: sellerMode ? "seller" : "client",
      });
      await loadConversations(data.id);
      setActive(data.id);
      setMobileConversationOpen(true);
      setSupportError("");
    } catch (error) {
      setSupportError(
        error.response?.data?.message ||
          "Impossible d’ouvrir le support VinnHT.",
      );
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !active) return;
    await api.post(`/messages/conversations/${active}`, { body: draft.trim() });
    setDraft("");
    await Promise.all([loadMessages(active), loadConversations()]);
  };

  const deleteConversation = async () => {
    if (!active || deletingConversation) return;
    if (!window.confirm("Supprimer cette discussion de votre espace ?")) return;
    try {
      setDeletingConversation(true);
      await api.delete(`/messages/conversations/${active}`);
      setMessages([]);
      await loadConversations();
      setMobileConversationOpen(false);
      setConversationActionsOpen(false);
    } finally {
      setDeletingConversation(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!active || deletingMessageId) return;
    if (!window.confirm("Supprimer ce message pour vous ?")) return;
    try {
      setDeletingMessageId(messageId);
      const { data } = await api.delete(`/messages/${messageId}`);
      if (data?.conversationHidden) {
        setMessages([]);
        await loadConversations();
        setMobileConversationOpen(false);
        setActiveMessageActionId(null);
        return;
      }
      await Promise.all([loadMessages(active), loadConversations(active)]);
      setActiveMessageActionId(null);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const currentQuery = externalQuery ?? query;
  const visible = conversations.filter((item) =>
    (item.name || "").toLowerCase().includes(currentQuery.toLowerCase())
  );
  const current = conversations.find((item) => item.id === active);
  const rootClassName = `seller-flow marketplace-messages-page${
    onExternalQueryChange ? " marketplace-messages-page--external-search" : ""
  }`;

  return (
    <div className={rootClassName}>
      {supportError && <div className="seller-message">{supportError}</div>}
      <div className={`client-messages-shell ${mobileConversationOpen ? "conversation-open" : ""}`}>
        <aside className="conversation-list">
          {!sellerMode && isClientUser && (
            <select defaultValue="" onChange={startConversation}>
              <option value="" disabled>
                Nouvelle conversation
              </option>
              {contacts.map((contact) => (
                <option value={contact.id} key={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          )}
          {sellerMode && isSellerUser && !isSupportStaff && (
            <button
              type="button"
              className="conversation-support-trigger"
              onClick={openSupportConversation}
            >
              <MessageCircle />
              Contacter le support VinnHT
            </button>
          )}
          <label>
            <Search />
            <input
              value={currentQuery}
              onChange={(event) => {
                if (onExternalQueryChange) {
                  onExternalQueryChange(event.target.value);
                } else {
                  setQuery(event.target.value);
                }
              }}
              placeholder="Rechercher"
            />
          </label>
          <div className="conversation-contacts-scroll">
            {visible.map((conversation) => (
              <button
                className={active === conversation.id ? "active" : ""}
                onClick={() => {
                  setActive(conversation.id);
                  setMobileConversationOpen(true);
                }}
                key={conversation.id}
              >
                <ConversationAvatar image={conversation.image_url} name={conversation.name} />
                <p>
                  <b>{conversation.name}</b>
                  <small>{conversation.last_message || "Nouvelle conversation"}</small>
                </p>
                <span className="conversation-meta">
                  <time className="conversation-last-time">
                    {formatMessageTime(conversation.last_message_at)}
                  </time>
                  {conversation.unread_count ? (
                    <span className="conversation-unread-badge">
                      {conversation.unread_count}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
            {!visible.length && (
              <div className="conversation-list-empty">
                Aucune discussion trouvée.
              </div>
            )}
          </div>
        </aside>
        <section className="conversation-room">
          {current ? (
            <>
              <header>
                <button
                  type="button"
                  className="messages-mobile-back"
                  onClick={() => setMobileConversationOpen(false)}
                  aria-label="Retour aux discussions"
                >
                  <ArrowLeft />
                </button>
                <ConversationAvatar image={current.image_url} name={current.name} large />
                <div className="conversation-room-contact">
                  <h3>{current.name}</h3>
                  {isSupportStaff && current.owner_name ? (
                    <small className="conversation-owner-line">
                      Propriétaire : {current.owner_name}
                    </small>
                  ) : null}
                  <p>
                    <ShieldCheck />
                    Conversation sécurisée
                  </p>
                </div>
                <div
                  className={`conversation-actions ${conversationActionsOpen ? "open" : ""}`}
                  ref={conversationActionsRef}
                  onMouseLeave={() => setConversationActionsOpen(false)}
                >
                  <button
                    type="button"
                    className="conversation-actions-trigger"
                    onClick={() => setConversationActionsOpen((value) => !value)}
                    aria-label="Actions de discussion"
                    title="Actions de discussion"
                  >
                    <Ellipsis />
                  </button>
                  <button
                    type="button"
                    className="conversation-clear-button"
                    onClick={deleteConversation}
                    disabled={deletingConversation}
                    aria-label="Effacer la discussion"
                    title="Effacer la discussion"
                  >
                    <Trash2 />
                    <span>Effacer</span>
                  </button>
                </div>
              </header>
              <div className="message-history" ref={historyRef}>
                {messages.length ? (
                  messages.map((message) => (
                    <article
                      className={Number(message.sender_id) === Number(user.id) ? "sent" : "received"}
                      key={message.id}
                      onClick={() =>
                        setActiveMessageActionId((currentId) =>
                          currentId === message.id ? null : message.id,
                        )
                      }
                    >
                      <time>{formatMessageTime(message.created_at)}</time>
                      <div
                        className={`message-bubble-row ${
                          activeMessageActionId === message.id ? "action-visible" : ""
                        }`}
                      >
                        <p>{message.body}</p>
                        <button
                          type="button"
                          className="message-delete-button"
                          onClick={() => deleteMessage(message.id)}
                          disabled={deletingMessageId === message.id}
                          aria-label="Effacer ce message pour moi"
                          title="Effacer pour moi"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="message-history-empty">
                    <ConversationAvatar image={current.image_url} name={current.name} large />
                    <strong>Discutez avec {current.name}</strong>
                    <span>
                      Posez votre question ici. Vos échanges restent protégés dans VinnHT.
                    </span>
                  </div>
                )}
              </div>
              <form onSubmit={sendMessage} aria-label="Écrire un message">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Écrire un message..."
                />
                <button aria-label="Envoyer le message">
                  <Send />
                </button>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <MessageCircle />
              <h3>{sellerMode ? "Aucun message client" : "Commencez une conversation"}</h3>
              <p>
                {sellerMode
                   ? "Les nouvelles questions de vos clients apparaîtront ici."
                  : "Choisissez une boutique dans la liste."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
