using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace ArTacticalTrainer.Core
{
    /// <summary>
    /// The operator's immediate "did that land" feedback — a full-screen
    /// color flash plus a HIT/MISS/HOSTAGE label, since there's no real
    /// impact to feel. Subscribe this to a ShotResolver in the Editor.
    /// </summary>
    public class HitFeedbackUI : MonoBehaviour
    {
        [SerializeField] private ShotResolver shotResolver;
        [SerializeField] private Image flashImage;
        [SerializeField] private Text resultLabel;
        [SerializeField] private float flashDuration = 0.25f;
        [SerializeField] private Color hitColor = new(0.3f, 0.85f, 0.4f, 0.35f);
        [SerializeField] private Color missColor = new(0.85f, 0.3f, 0.3f, 0.35f);

        private Coroutine flashRoutine;

        private void OnEnable()
        {
            if (shotResolver != null)
            {
                shotResolver.ShotResolved += HandleShotResolved;
            }
        }

        private void OnDisable()
        {
            if (shotResolver != null)
            {
                shotResolver.ShotResolved -= HandleShotResolved;
            }
        }

        private void HandleShotResolved(ShotResult result)
        {
            string label = result.Hit ? $"HIT — {result.Zone}" : "MISS";
            Color color = result.Hit ? hitColor : missColor;

            if (flashRoutine != null) StopCoroutine(flashRoutine);
            flashRoutine = StartCoroutine(Flash(color, label));
        }

        private IEnumerator Flash(Color color, string label)
        {
            if (resultLabel != null) resultLabel.text = label;
            if (flashImage != null) flashImage.color = color;

            yield return new WaitForSeconds(flashDuration);

            if (flashImage != null) flashImage.color = Color.clear;
        }
    }
}
