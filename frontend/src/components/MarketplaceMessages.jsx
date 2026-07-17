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

export default function MarketplaceMessages({
  api,
  user,
  sellerMode = false,
  onMobileConversationChange,
  externalQuery,
  onExternalQueryChange,
}) {
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

  useEffect(() => {
    onMobileConversationChange?.(mobileConversationOpen);
  }, [mobileConversationOpen, onMobileConversationChange]);

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-message-conversation-open",
      mobileConversationOpen,
    );
    return () => {
      document.body.classList.remove("mobile-message-conversation-open");
    };
  }, [mobileConversationOpen]);

  const loadConversations = async (preferredConversation = null) => {
    const { data } = await api.get("/messages/conversations");
    setConversations(data);
    setActive(
      (current) => {
        const candidate = preferredConversation || requestedConversation || current;
        if (candidate && data.some((item) => Number(item.id) === Number(candidate))) {
          return candidate;
        }
        return data[0]?.id || null;
      },
    );
  };

  const loadMessages = async (id) => {
    if (!id) return setMessages([]);
    const { data } = await api.get(`/messages/conversations/${id}`);
    setMessages(data);
    setConversations((items) =>
      items.map((item) =>
        Number(item.id) === Number(id) ? { ...item, unread_count: 0 } : item,
      ),
    );
    window.dispatchEvent(new CustomEvent("vinnht:notifications-refresh"));
  };

  useEffect(() => {
    const initialize = async () => {
      let supportConversation = null;
      try {
        if (openSupport) {
          const { data } = await api.post("/messages/support", {
            context: sellerMode ? "seller" : "client",
          });
          supportConversation = data.id;
          setMobileConversationOpen(true);
        }
        await loadConversations(supportConversation);
      } catch (error) {
        setSupportError(
          error.response?.data?.message ||
            "Impossible d’ouvrir le support VinnHT.",
        );
      }
    };
    initialize();
    if (preparedDraft) setDraft(preparedDraft);
    if (!sellerMode) api.get("/messages/contacts").then(({ data }) => setContacts(data));
    const interval = window.setInterval(loadConversations, 10000);
    return () => window.clearInterval(interval);
  }, []);

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
          {!sellerMode && (
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
          {sellerMode && !isSupportStaff && (
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
